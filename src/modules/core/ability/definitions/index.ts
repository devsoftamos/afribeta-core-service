import { Action, RequiredRule, Subjects } from "../interfaces";

export class CreateAgentAbility implements RequiredRule {
    action: Action = Action.CreateAgent;
    subject: Subjects = "User";
}

export class ViewAgentAbility implements RequiredRule {
    action: Action = Action.ViewAgent;
    subject: Subjects = "User";
}

export class FundAgentAbility implements RequiredRule {
    action: Action = Action.FundAgent;
    subject: Subjects = "User";
}

export class FundRequestAbility implements RequiredRule {
    action: Action = Action.FundRequest;
    subject: Subjects = "User";
}
