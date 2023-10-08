import { User, Transaction, Wallet, BankAccount } from "@prisma/client";
import { PureAbility } from "@casl/ability";
import { PrismaQuery, Subjects as PrismaSubjects } from "@casl/prisma";

export type Subjects = PrismaSubjects<{
    User: User;
    Transaction: Transaction;
    Wallet: Wallet;
    BankAccount: BankAccount;
}>;

export type AppAbility = PureAbility<[string, Subjects], PrismaQuery>;

export enum Action {
    Manage = "manage",
    Create = "create",
    Read = "read",
    Update = "update",
    Delete = "delete",
    CreateSubAgent = "subagent.create", //Create Agent
    ViewSubAgent = "subagent.view", //merchant view sub-agent
    FundSubAgent = "subagent.fund", //merchant fund sub agent
    FundRequest = "fund.request", //Sub agent request fund from merchant
    FundWalletFromCommission = "wallet.fund.from.commission", //Fund main wallet from commission wallet
    PayoutRequest = "payout.request", //Request for payout
    CreateBankAccount = "bank_account.create", //Add bank account details
    ReadBankAccount = "bank_account.read", //View own bank account details
    CreateKYC = "kyc.create",

    //admin
    ReadReport = "report.read",
    ReadUserBalance = "user_balance.read",
    ManageAccount = "account.manage",
    AuthorizeKYC = "kyc.authorize",
    ReadTransaction = "transaction.read",
    AuthorizePayout = "payout.authorize",
    ReadPayout = "payout.read",
    ReadThirdPartyWalletBalance = "third_party_wallet.read",
    ReadUsersWalletSummary = "wallet_summary.read",
}

export interface RequiredRule {
    action: Action;
    subject: Subjects;
}
