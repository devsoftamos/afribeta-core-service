import {
    Notification,
    PaymentChannel,
    Prisma,
    TransactionFlow,
    TransactionStatus,
    TransactionType,
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
    GTBANK = "GTBANK",
    POLARIS = "POLARIS",
    FSDH360 = "FSDH360",
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

export enum WalletToBankTransferStatus {
    FAILED = "FAILED",
    SUCCESS = "SUCCESS",
}

export interface ProcessWalletWithdrawalOptions {
    paymentReference: string;
    transferToBankStatus: WalletToBankTransferStatus;
    transferCode?: string;
}

export interface VerifyWalletTransaction {
    type: TransactionType;
    flow: TransactionFlow;
    amount: number;
    serviceCharge: number;
    status: TransactionStatus;
    paymentStatus: PaymentStatus;
    transactionId: string;
    totalAmount?: number;
    reference: string;
    user: {
        firstName: string;
        lastName: string;
        businessName?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface VerifyWalletFundTransaction extends VerifyWalletTransaction {
    paymentChannel: PaymentChannel;
}

export interface VerifyWalletToBankTransferTransaction
    extends VerifyWalletTransaction {
    receiver: {
        destinationBankName: string;
        destinationBankAccountNumber: string;
        destinationBankAccountName: string;
    };
}

export interface VerifyWalletToWalletTransferTransaction
    extends VerifyWalletTransaction {
    receiver: {
        walletNumber: string;
        name: string;
        bankName: string;
    };
}

export interface VerifySubAgentWalletFundTransaction
    extends VerifyWalletTransaction {
    agent: {
        firstName: string;
        lastName: string;
        walletNumber: string;
    };
}

export interface FundSubAgentHandlerResponse {
    paymentReference: string;
}

export interface FundSubAgentHandlerOptions {
    agentId: number;
    amount: number;
    notificationRecord?: Notification;
}

export type PayoutRequestTransaction = VerifyWalletTransaction;

export interface WalletBalance {
    commissionBalance: number;
    mainBalance: number;
}
