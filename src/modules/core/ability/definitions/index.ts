import { subject } from "@casl/ability";
import { Action, RequiredRule, Subjects } from "../interfaces";

export class CreateAgentAbility implements RequiredRule {
    action: Action = Action.CreateAgent;
    subject: Subjects = "User";
}

export class ViewAgentAbility implements RequiredRule {
    action: Action = Action.ViewAgent;
    subject: Subjects = "User";
}
