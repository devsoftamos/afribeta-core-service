import { Action, RequiredRule, Subjects } from "../interfaces";

export class CreateAgentAbility implements RequiredRule {
    action: Action = Action.CreateAgent;
    subject: Subjects = "User";
}
