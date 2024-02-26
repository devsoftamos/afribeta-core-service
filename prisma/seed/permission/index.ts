import { Action } from "../../../src/modules/core/ability/interfaces";
import { Prisma } from "@prisma/client";

export const permissions: Prisma.PermissionUncheckedCreateInput[] = [
    {
        name: Action.ReadReport,
        description: "View Report",
    },
    {
        name: Action.ReadUserBalance,
        description: "View single user wallet balance",
    },
    {
        name: Action.ReadUser,
        description: "View Users",
    },
    {
        name: Action.AccountActivationAndDeactivation,
        description: "Activation and Deactivation of Accounts",
    },
    {
        name: Action.AuthorizeAgentUpgrade,
        description: "Approve/Decline Agent Upgrade Request",
    },
    {
        name: Action.ReadTransaction,
        description: "View Transaction History",
    },
    {
        name: Action.FundWithdrawRecommend,
        description: "Fund withdrawal recommendations",
    },
    //super admin (ceo/chairman)
    {
        name: Action.AuthorizePayout,
        description: "Approve/Decline Fund Withdrawal",
    },
    {
        name: Action.ReadPayout,
        description: "Payout/Fund Withdrawal Summary",
    },
    {
        name: Action.ReadThirdPartyWalletBalance,
        description: "Third Party Providers Wallet Balance Summary",
    },
    {
        name: Action.ReadUsersWalletSummary,
        description: "Users Wallet Balance Summary",
    },
    {
        name: Action.CreateAdmin,
        description: "Create Admin Users",
    },
    {
        name: Action.CreateRole,
        description: "Create Role and Assign Permissions",
    },
    {
        name: Action.ReadRole,
        description: "View Roles",
    },
    {
        name: Action.AssignRole,
        description: "Assign Roles",
    },
    {
        name: Action.ReadPermission,
        description: "View Permissions",
    },
    {
        name: Action.AssignPermission,
        description: "Assign Permissions to Roles",
    },
    {
        name: Action.ReadCommission,
        description: "View Commission",
    },
    {
        name: Action.UpdateCommission,
        description: "Update Commission",
    },
    {
        name: Action.ReadKyc,
        description: "View KYC Information",
    },
];
