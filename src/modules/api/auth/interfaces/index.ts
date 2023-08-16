import { User } from "@prisma/client";
import { Request } from "express";

export interface RequestWithUser extends Request {
    user: User;
}

export interface DataStoredInToken {
    sub: string;
}

interface PaystackHeader {
    ["x-paystack-signature"]: string;
}

interface SquadGTBankHeader {
    ["x-squad-signature"]: string;
}

export type RequestFromPaystack = Request & { headers: PaystackHeader };

export type RequestFromSquadGTBank = Request & { headers: SquadGTBankHeader };

export interface AgentVerifyEmailParams {
    firstName: string;
    code: string;
    merchantName: string;
    merchantEmail: string;
}

interface FSDH360BankHeader {
    "api-key-auth": string;
}

export type RequestFromFSDH360Bank = Request & { headers: FSDH360BankHeader };
