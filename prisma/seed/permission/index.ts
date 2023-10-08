import { Permission } from "@/modules/api/role/interfaces";
import { Prisma } from "@prisma/client";

export const permissions: Prisma.PermissionUncheckedCreateInput[] = [
    {
        name: Permission.ReadReport,
        description: "View Report",
    },
    {
        name: Permission.ReadUserBalance,
        description: "View single user wallet balance",
    },
    {
        name: "enquiry", //
        description: "Enquiry",
    },
    {
        name: Permission.ManageAccount,
        description: "Activation and Deactivation of accounts",
    },
    {
        name: Permission.AuthorizeKYC,
        description: "Approve or Decline KYC",
    },
    {
        name: Permission.ReadTransaction,
        description: "View Transaction History",
    },
    {
        name: "",
        description: "Fund withdrawal recommendations", //
    },
    //super admin
    {
        name: Permission.AuthorizePayout,
        description: "Approve/Decline Fund Withdrawal",
    },
    {
        name: Permission.ReadPayout,
        description: "Payout/Fund Withdrawal Summary",
    },
    {
        name: Permission.ReadThirdPartyWalletBalance,
        description: "Third Party Providers Wallet Balance Summary",
    },
    {
        name: Permission.ReadUsersWalletSummary,
        description: "Users Wallet Balance Summary",
    },
];
