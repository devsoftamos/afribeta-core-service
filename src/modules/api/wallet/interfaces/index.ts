import { Prisma } from "@prisma/client";

export type UserWalletCreation = Prisma.WalletUncheckedCreateInput &
    Prisma.VirtualBankAccountUncheckedCreateInput;

export enum VirtualAccountProviders {
    Paystack = "paystack",
    ProvidusBank = "providus",
}

export interface CreateWalletAccount {
    email: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    provider: VirtualAccountProviders;
    customerCode: string;
}
