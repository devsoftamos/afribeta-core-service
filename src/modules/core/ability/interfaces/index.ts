import {
    User,
    Transaction,
    Wallet,
    BankAccount,
    Role,
    Permission,
    RolePermission,
    BillService,
    KycInformation,
} from "@prisma/client";
import { PureAbility } from "@casl/ability";
import { PrismaQuery, Subjects as PrismaSubjects } from "@casl/prisma";

export type Subjects = PrismaSubjects<{
    User: User;
    Transaction: Transaction;
    Wallet: Wallet;
    BankAccount: BankAccount;
    Role: Role;
    Permission: Permission;
    RolePermission: RolePermission;
    BillService: BillService;
    KycInformation: KycInformation;
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
    ReadUser = "user.read",
    ReadUserBalance = "user_balance.read",
    AccountActivationAndDeactivation = "account.activate_deactivate",
    AuthorizeAgentUpgrade = "agent.upgrade.authorize",
    ReadTransaction = "transaction.read",
    AuthorizePayout = "payout.authorize",
    ReadPayout = "payout.read",
    ReadThirdPartyWalletBalance = "third_party_wallet.read",
    ReadUsersWalletSummary = "wallet_summary.read",
    FundWithdrawRecommend = "fund.withdraw.recommend",
    CreateAdmin = "admin.create",
    CreateRole = "role.create",
    ReadRole = "role.read",
    ReadPermission = "permission.read",
    AssignRole = "role.assign",
    AssignPermission = "permission.assign",
    ReadCommission = "commission.read",
    UpdateCommission = "commission.update",
    ReadKyc = "kyc.read",
}

export interface RequiredRule {
    action: Action;
    subject: Subjects;
}
