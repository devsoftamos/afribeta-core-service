import {
    PaymentChannel,
    Prisma,
    TransactionStatus,
    VirtualAccountProviders,
} from "@prisma/client";
import { WalletFundTransactionFlow, PaymentStatus } from "@prisma/client";

export type UserWalletCreation = Prisma.WalletUncheckedCreateInput &
    Prisma.VirtualBankAccountUncheckedCreateInput;

export interface CreateWalletAAndVirtualAccount {
    email: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    provider: VirtualAccountProviders;
    customerCode: string;
    providerBankSlug?: string;
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
}

export interface ProcessWalletWithdrawalOptions {
    paymentReference: string;
    paymentStatus: PaymentStatus;
    transferCode?: string;
}
