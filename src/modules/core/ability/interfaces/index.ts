import { User, Transaction, Wallet } from "@prisma/client";
import { PureAbility } from "@casl/ability";
import { PrismaQuery, Subjects as PrismaSubjects } from "@casl/prisma";

export type Subjects = PrismaSubjects<{
    User: User;
    Transaction: Transaction;
    Wallet: Wallet;
}>;

export type AppAbility = PureAbility<[string, Subjects], PrismaQuery>;

export enum Action {
    Manage = "manage",
    Create = "create",
    Read = "read",
    Update = "update",
    Delete = "delete",
    CreateAgent = "agent.create",
    ViewAgent = "agent.view",
    FundAgent = "agent.fund",
    FundRequest = "fund.request",
    FundWalletFromCommission = "wallet.commission.fund.main",
    PayoutRequest = "payout.request",
}

export interface RequiredRule {
    action: Action;
    subject: Subjects;
}
