import { Action } from "@/modules/core/ability/interfaces";
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
        name: "enquiry",
        description: "Enquiry",
    },
    {
        name: Action.ManageAccount,
        description: "Activation and Deactivation of accounts",
    },
    {
        name: Action.AuthorizeKYC,
        description: "Approve or Decline KYC",
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
];
