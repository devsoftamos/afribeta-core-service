import { Action, RequiredRule, Subjects } from "../interfaces";

//*********************default app user ********************** */
export class CreateSubAgentAbility implements RequiredRule {
    action: Action = Action.CreateSubAgent;
    subject: Subjects = "User";
}

export class ViewSubAgentAbility implements RequiredRule {
    action: Action = Action.ViewSubAgent;
    subject: Subjects = "User";
}

export class UpdateSubAgentAbility implements RequiredRule {
    action: Action = Action.UpdateSubAgent;
    subject: Subjects = "User";
}

export class DeleteSubAgentAbility implements RequiredRule {
    action: Action = Action.DeleteSubAgent;
    subject: Subjects = "User";
}

export class FundSubAgentAbility implements RequiredRule {
    action: Action = Action.FundSubAgent;
    subject: Subjects = "User";
}

export class FundRequestAbility implements RequiredRule {
    action: Action = Action.FundRequest;
    subject: Subjects = "User";
}

export class FundWalletFromCommissionAbility implements RequiredRule {
    action: Action = Action.FundWalletFromCommission;
    subject: Subjects = "Wallet";
}

export class PayoutRequestAbility implements RequiredRule {
    action: Action = Action.PayoutRequest;
    subject: Subjects = "User";
}

export class CreateBankAccountAbility implements RequiredRule {
    action: Action = Action.CreateBankAccount;
    subject: Subjects = "BankAccount";
}

export class ReadBankAccountAbility implements RequiredRule {
    action: Action = Action.ReadBankAccount;
    subject: Subjects = "BankAccount";
}

export class CreateKYCAbility implements RequiredRule {
    action: Action = Action.CreateKYC;
    subject: Subjects = "User";
}

//***************** admin ***************************
export class ReadUserAbility implements RequiredRule {
    action: Action = Action.ReadUser;
    subject: Subjects = "User";
}

export class ReadUserBalanceAbility implements RequiredRule {
    action: Action = Action.ReadUserBalance;
    subject: Subjects = "Wallet";
}

export class AccountActivationAndDeactivationAbility implements RequiredRule {
    action: Action = Action.AccountActivationAndDeactivation;
    subject: Subjects = "User";
}

export class AuthorizeAgentUpgradeAbility implements RequiredRule {
    action: Action = Action.AuthorizeAgentUpgrade;
    subject: Subjects = "User";
}

export class ReadTransactionAbility implements RequiredRule {
    action: Action = Action.ReadTransaction;
    subject: Subjects = "Transaction";
}

export class AuthorizePayoutAbility implements RequiredRule {
    action: Action = Action.AuthorizePayout;
    subject: Subjects = "Transaction";
}

export class ReadPayoutAbility implements RequiredRule {
    action: Action = Action.ReadPayout;
    subject: Subjects = "Transaction";
}

export class ReadThirdPartyWalletBalanceAbility implements RequiredRule {
    action: Action = Action.ReadThirdPartyWalletBalance;
    subject: Subjects = "Wallet";
}

export class ReadUsersWalletSummaryAbility implements RequiredRule {
    action: Action = Action.ReadUsersWalletSummary;
    subject: Subjects = "Wallet";
}

export class FundWithdrawRecommendAbility implements RequiredRule {
    action: Action = Action.FundWithdrawRecommend;
    subject: Subjects = "Transaction";
}

export class CreateAdminAbility implements RequiredRule {
    action: Action = Action.CreateAdmin;
    subject: Subjects = "User";
}

export class CreateRoleAbility implements RequiredRule {
    action: Action = Action.CreateRole;
    subject: Subjects = "Role";
}

export class ReadRoleAbility implements RequiredRule {
    action: Action = Action.ReadRole;
    subject: Subjects = "Role";
}

export class ReadPermissionAbility implements RequiredRule {
    action: Action = Action.ReadPermission;
    subject: Subjects = "Permission";
}

export class AssignRoleAbility implements RequiredRule {
    action: Action = Action.AssignRole;
    subject: Subjects = "User";
}

export class AssignPermissionAbility implements RequiredRule {
    action: Action = Action.AssignPermission;
    subject: Subjects = "RolePermission";
}

//
export class ReadCommissionAbility implements RequiredRule {
    action: Action = Action.ReadCommission;
    subject: Subjects = "BillService";
}

export class UpdateCommissionAbility implements RequiredRule {
    action: Action = Action.UpdateCommission;
    subject: Subjects = "BillService";
}

export class ReadKycAbility implements RequiredRule {
    action: Action = Action.ReadKyc;
    subject: Subjects = "KycInformation";
}

export class ReadReportAbility implements RequiredRule {
    action: Action = Action.ReadReport;
    subject: Subjects = "Transaction";
}

export class AdminActivationAndDeactivationAbility implements RequiredRule {
    action: Action = Action.AdminActivationAndDeactivation;
    subject: Subjects = "User";
}
