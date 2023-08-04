import { User, Transaction } from "@prisma/client";
import { PureAbility } from "@casl/ability";
import { PrismaQuery, Subjects as PrismaSubjects } from "@casl/prisma";

export type Subjects = PrismaSubjects<{
    User: User;
    Transaction: Transaction;
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
}

export interface RequiredRule {
    action: Action;
    subject: Subjects;
    fields?: string[];
    conditions?: Record<string, any>;
}