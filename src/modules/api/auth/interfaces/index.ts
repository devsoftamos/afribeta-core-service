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

export type RequestFromPaystack = Request & { headers: PaystackHeader };
