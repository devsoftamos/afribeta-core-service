import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { AbilityBuilder } from "@casl/ability";
import { createPrismaAbility } from "@casl/prisma";
import { Action, AppAbility } from "../interfaces";
import { PrismaService } from "../../prisma/services";

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
        if (role.permissions) {
            permissions = role.permissions.map((p) => p.permission.name);
        }
        const { can, cannot, build } = new AbilityBuilder<AppAbility>(
            createPrismaAbility
        );

        console.log(user.id, "*******", permissions);

        can(Action.CreateAgent, "User");
        can(Action.ViewAgent, "User");
        can(Action.FundAgent, "User");
        can(Action.ViewAgent, "User", { createdById: user.id });
        can(Action.FundAgent, "User", { createdById: user.id });
        can(Action.FundRequest, "User");
        can(Action.FundWalletFromCommission, "Wallet");

        cannot(Action.ViewAgent, "User", {
            createdById: { not: user.id },
        }).because(
            "Insufficient permission! You can only view resources of your agent"
        );
        cannot(Action.FundAgent, "User", {
            createdById: { not: user.id },
        }).because("Insufficient permission. You can only fund your agent");

        //Agent Management
        if (!permissions.includes(Action.CreateAgent)) {
            cannot(Action.CreateAgent, "User").because(
                "Your account type does not have sufficient permission to create agent"
            );
        }

        if (!permissions.includes(Action.ViewAgent)) {
            cannot(Action.ViewAgent, "User").because(
                "Your account type does not have sufficient permission to view agent resource"
            );
        }
        if (!permissions.includes(Action.FundAgent)) {
            cannot(Action.FundAgent, "User").because(
                "Your account type does not have sufficient permission to fund agent"
            );
        }
        if (!permissions.includes(Action.FundRequest)) {
            cannot(Action.FundRequest, "User").because(
                "Your account type does not have sufficient permission for fund request"
            );
        }
        if (!permissions.includes(Action.FundWalletFromCommission)) {
            cannot(Action.FundWalletFromCommission, "Wallet").because(
                "Your account type does not have sufficient permission to fund wallet from commission wallet"
            );
        }

        return build();
    }
}
