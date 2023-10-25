import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { AbilityBuilder } from "@casl/ability";
import { createPrismaAbility } from "@casl/prisma";
import { Action, AppAbility } from "../interfaces";
import { PrismaService } from "../../prisma/services";
import { RoleSlug } from "@/modules/api/role/interfaces";

@Injectable()
export class AbilityFactory {
    constructor(private prisma: PrismaService) {}
    async createForUser(user: User) {
        const role = await this.prisma.role.findUnique({
            where: {
                id: user.roleId,
            },
            select: {
                id: true,
                slug: true,
                permissions: {
                    select: { permission: { select: { name: true } } },
                },
            },
        });
        let permissions = [];
        if (role.permissions.length) {
            permissions = role.permissions.map((p) => p.permission.name);
        }

        console.log(permissions);

        const agencyRoleTypes = [
            RoleSlug.MERCHANT,
            RoleSlug.SUB_AGENT,
            RoleSlug.AGENT,
        ];

        const mainAgencyTypes = [RoleSlug.MERCHANT, RoleSlug.AGENT];

        const { can, cannot, build } = new AbilityBuilder<AppAbility>(
            createPrismaAbility
        );

        can(Action.CreateSubAgent, "User");
        can(Action.ViewSubAgent, "User");
        can(Action.FundSubAgent, "User");
        can(Action.ViewSubAgent, "User");
        can(Action.FundSubAgent, "User");
        can(Action.FundRequest, "User");
        can(Action.FundWalletFromCommission, "Wallet");
        can(Action.PayoutRequest, "User");
        can(Action.ReadBankAccount, "BankAccount");
        can(Action.CreateBankAccount, "BankAccount");
        can(Action.CreateKYC, "User");

        //merchant only
        if (role.slug !== RoleSlug.MERCHANT) {
            cannot(Action.FundSubAgent, "User").because(
                "Insufficient permission. Account type cannot fund a sub agent account"
            );
            cannot(Action.ViewSubAgent, "User").because(
                "Your account type does not have sufficient permission to view agent resource"
            );
            cannot(Action.CreateSubAgent, "User").because(
                "Your account type does not have sufficient permission to create agent"
            );
            cannot(Action.ViewSubAgent, "User").because(
                "Your account type does not have sufficient permission to view sub agent resource"
            );
        }

        //all agency
        if (!agencyRoleTypes.includes(role.slug as any)) {
            cannot(Action.FundWalletFromCommission, "Wallet").because(
                "Your account type does not have sufficient permission to fund wallet from commission wallet"
            );
        }

        //agent and merchant
        if (!mainAgencyTypes.includes(role.slug as any)) {
            cannot(Action.PayoutRequest, "User").because(
                "Your account type does not have sufficient permission for payout request"
            );
            cannot(Action.ReadBankAccount, "BankAccount").because(
                "Your account type does not have sufficient permission to view bank account"
            );
            cannot(Action.CreateBankAccount, "BankAccount").because(
                "Your account type does not have sufficient permission to create bank account"
            );
        }

        //sub agent
        if (role.slug !== RoleSlug.SUB_AGENT) {
            cannot(Action.FundRequest, "User").because(
                "Your account type does not have sufficient permission for fund request"
            );
        }

        //agent
        if (role.slug !== RoleSlug.AGENT) {
            cannot(Action.CreateKYC, "User").because(
                "Your account type does not have sufficient permission to add KYC"
            );
        }

        //admins

        return build();
    }
}
