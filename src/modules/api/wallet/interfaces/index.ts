import {
    PaymentChannel,
    Prisma,
    TransactionStatus,
    VirtualAccountProvider,
} from "@prisma/client";
import { WalletFundTransactionFlow, PaymentStatus } from "@prisma/client";

export type UserWalletCreation = Prisma.WalletUncheckedCreateInput &
    Prisma.VirtualBankAccountUncheckedCreateInput;

export interface CreateWalletAAndVirtualAccount {
    email: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    provider: VirtualAccountProvider;
    customerCode: string;
    providerBankSlug?: string;
}

export enum WalletFundProvider {
    PAYSTACK = "PAYSTACK",
    PROVIDUS = "PROVIDUS",
    WALLET = "WALLET",
}

export interface ProcessWalletFundOptions {
    userId?: number;
    amount?: number;
    serviceCharge?: number;
    paymentStatus?: PaymentStatus;
    walletFundTransactionFlow: WalletFundTransactionFlow;
    senderId?: number;
    receiverId?: number;
    paymentChannel?: PaymentChannel;
    status?: TransactionStatus;
    paymentReference?: string;
    provider: WalletFundProvider;
}

export interface ProcessWalletWithdrawalOptions {
    paymentReference: string;
    paymentStatus: PaymentStatus;
    transferCode?: string;
}
