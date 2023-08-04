import { User } from "@prisma/client";
import { BillServiceCommissionOptions } from "../dtos";

export interface CreateUser {
    firstName: string;
}

export interface ValidateAgentCommissionAssignmentOptions {
    merchantId: number;
    billServiceCommissions: BillServiceCommissionOptions[];
}

export interface AgentCreationEventOptions {
    user: User;
}
export interface UserEventMap {
    "agent-creation": AgentCreationEventOptions;
}

export interface AgentPostAccountCreateEmailParams {
    firstName: string;
    email: string;
    password: string;
}
