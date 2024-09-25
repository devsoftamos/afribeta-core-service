import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { AbilityBuilder } from "@casl/ability";
import { createPrismaAbility } from "@casl/prisma";
import { Action, AppAbility } from "../interfaces";
import { PrismaService } from "../../prisma/services";
import { RoleSlug } from "@/modules/api/accessControl/interfaces";

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
        can(Action.CreateKYC, "KycInformation");
        can(Action.UpdateSubAgent, "User");
        can(Action.DeleteSubAgent, "User");
        can(Action.UpdateKyc, "KycInformation");
        can(Action.ViewOwnKyc, "KycInformation");

        //admin
        can(Action.AccountActivationAndDeactivation, "User");
        can(Action.AuthorizeAgentUpgrade, "User");
        can(Action.ReadReport, "Transaction");
        can(Action.ReadUser, "User");
        can(Action.ReadUserBalance, "Wallet");
        can(Action.ReadTransaction, "Transaction");
        can(Action.ReadThirdPartyWalletBalance, "Wallet");
        can(Action.AuthorizePayout, "Transaction");
        can(Action.ReadPayout, "Transaction");
        can(Action.FundWithdrawRecommend, "Transaction");
        can(Action.ReadUsersWalletSummary, "Wallet");
        can(Action.CreateRole, "Role");
        can(Action.ReadRole, "Role");
        can(Action.AssignRole, "User");
        can(Action.ReadPermission, "Permission");
        can(Action.AssignPermission, "RolePermission");
        can(Action.CreateAdmin, "User");
        can(Action.ReadCommission, "BillService");
        can(Action.UpdateCommission, "BillService");
        can(Action.AdminActivationAndDeactivation, "User");
        can(Action.ReadKyc, "KycInformation");

        //merchant only
        if (role.slug !== RoleSlug.MERCHANT) {
            cannot(Action.FundSubAgent, "User").because(
                "Insufficient permission. Account type cannot fund a subagent account"
            );
            cannot(Action.ViewSubAgent, "User").because(
                "Your account type does not have sufficient permission to view subagent resource"
            );
            cannot(Action.CreateSubAgent, "User").because(
                "Your account type does not have sufficient permission to create agent"
            );
            cannot(Action.ViewSubAgent, "User").because(
                "Your account type does not have sufficient permission to view subagent resource"
            );
            cannot(Action.ViewSubAgent, "User").because(
                "Your account type does not have sufficient permission to update subagent resource"
            );
            cannot(Action.DeleteSubAgent, "User").because(
                "Your account type does not have sufficient permission to delete subagent resource"
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
            cannot(Action.ViewOwnKyc, "KycInformation").because(
                "Insufficient permission to view KYC Information"
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
            cannot(Action.CreateKYC, "KycInformation").because(
                "Your account type does not have sufficient permission to add KYC"
            );
            cannot(Action.UpdateKyc, "KycInformation").because(
                "Your account type does not have sufficient permission to update KYC"
            );
        }

        //admins
        if (role.slug !== RoleSlug.SUPER_ADMIN) {
            //read user
            if (!permissions.includes(Action.ReadUser)) {
                cannot(Action.ReadUser, "User").because(
                    "Insufficient permission to view user(s)"
                );
            }

            //read report
            if (!permissions.includes(Action.ReadReport)) {
                cannot(Action.ReadReport, "Transaction").because(
                    "Insufficient permission to view report"
                );
            }

            //read user wallet balance
            if (!permissions.includes(Action.ReadUserBalance)) {
                cannot(Action.ReadUserBalance, "Wallet").because(
                    "Insufficient permission to view user wallet balance"
                );
            }

            //activate/deactivation of account
            if (
                !permissions.includes(Action.AccountActivationAndDeactivation)
            ) {
                cannot(Action.AccountActivationAndDeactivation, "User").because(
                    "Insufficient permission for account activation and deactivation"
                );
            }

            //Approve/decline agent upgrade request
            if (!permissions.includes(Action.AuthorizeAgentUpgrade)) {
                cannot(Action.AuthorizeAgentUpgrade, "User").because(
                    "Insufficient permission to authorize agent upgrade"
                );
            }

            //Read user transactions
            if (!permissions.includes(Action.ReadTransaction)) {
                cannot(Action.ReadTransaction, "Transaction").because(
                    "Insufficient permission to view user transaction"
                );
            }

            //approve/decline payout request
            if (!permissions.includes(Action.AuthorizePayout)) {
                cannot(Action.AuthorizePayout, "Transaction").because(
                    "Insufficient permission to authorize payout request"
                );
            }

            //Read/view payout request
            if (!permissions.includes(Action.ReadPayout)) {
                cannot(Action.ReadPayout, "Transaction").because(
                    "Insufficient permission to view user(s)"
                );
            }

            //Read third party wallet balance
            if (!permissions.includes(Action.ReadThirdPartyWalletBalance)) {
                cannot(Action.ReadThirdPartyWalletBalance, "Wallet").because(
                    "Insufficient permission to view third party wallet balance"
                );
            }

            //read summary of user wallet balance
            if (!permissions.includes(Action.ReadUsersWalletSummary)) {
                cannot(Action.ReadUsersWalletSummary, "Wallet").because(
                    "Insufficient permission to user view users wallet summary"
                );
            }

            //Recommend fund withdrawal
            if (!permissions.includes(Action.FundWithdrawRecommend)) {
                cannot(Action.FundWithdrawRecommend, "Transaction").because(
                    "Insufficient permission to recommend payout request"
                );
            }

            //create role
            if (!permissions.includes(Action.CreateRole)) {
                cannot(Action.CreateRole, "Role").because(
                    "Insufficient permission to view create, update or delete role"
                );
            }

            //read role
            if (!permissions.includes(Action.ReadRole)) {
                cannot(Action.ReadRole, "Role").because(
                    "Insufficient permission to view role(s)"
                );
            }

            //read permission
            if (!permissions.includes(Action.ReadPermission)) {
                cannot(Action.ReadPermission, "Permission").because(
                    "Insufficient permission to view permission(s)"
                );
            }

            //Assign role
            if (!permissions.includes(Action.AssignRole)) {
                cannot(Action.AssignRole, "User").because(
                    "Insufficient permission to assign role"
                );
            }

            //assign permissions to roles
            if (!permissions.includes(Action.AssignPermission)) {
                cannot(Action.ReadUser, "RolePermission").because(
                    "Insufficient permission to assign permissions to role"
                );
            }

            //
            if (!permissions.includes(Action.ReadCommission)) {
                cannot(Action.ReadCommission, "BillService").because(
                    "Insufficient permission to view commissions"
                );
            }

            //update commission
            if (!permissions.includes(Action.UpdateCommission)) {
                cannot(Action.UpdateCommission, "BillService").because(
                    "Insufficient permission to update permission"
                );
            }

            //view KYC info
            if (!permissions.includes(Action.ReadKyc)) {
                cannot(Action.ReadKyc, "KycInformation").because(
                    "Insufficient permission to view KYC Information"
                );
            }

            //Activate/Deactivate Admin Account
            if (!permissions.includes(Action.AdminActivationAndDeactivation)) {
                cannot(Action.AdminActivationAndDeactivation, "User").because(
                    "Insufficient permission to activate or deactivate admin account"
                );
            }
        }

        return build();
    }
}
