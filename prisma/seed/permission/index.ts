import { Prisma } from "@prisma/client";

export const permissions: Prisma.PermissionUncheckedCreateInput[] = [
    {
        name: "report.read",
        description: "View Report",
    },
    {
        name: "user_balance.read",
        description: "View single user wallet balance",
    },
    {
        name: "enquiry", //
        description: "Enquiry",
    },
    {
        name: "account.manage",
        description: "Activation and Deactivation of accounts",
    },
    {
        name: "kyc.authorize",
        description: "Approve or Decline KYC",
    },
    {
        name: "transaction.read",
        description: "View Transaction History",
    },
    {
        name: "",
        description: "Fund withdrawal recommendations", //
    },
    //super admin
    {
        name: "payout.authorize",
        description: "Approve/Decline Fund Withdrawal",
    },
    {
        name: "payout.read",
        description: "Payout/Fund Withdrawal Summary",
    },
    {
        name: "third_party_wallet.read",
        description: "Third Party Providers Wallet Balance Summary",
    },
    {
        name: "wallet_summary.read",
        description: "Users Wallet Balance Summary",
    },
];
