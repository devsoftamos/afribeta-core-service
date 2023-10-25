import { Action, RequiredRule, Subjects } from "../interfaces";

export class CreateSubAgentAbility implements RequiredRule {
    action: Action = Action.CreateSubAgent;
    subject: Subjects = "User";
}

export class ViewSubAgentAbility implements RequiredRule {
    action: Action = Action.ViewSubAgent;
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

//admin
