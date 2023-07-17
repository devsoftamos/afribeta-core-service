import { PrismaService } from "@/modules/core/prisma/services";
import {
    BillProvider,
    PaymentChannel,
    PaymentStatus,
    Transaction,
    TransactionType,
    User,
    UserType,
    Wallet,
} from "@prisma/client";
export * from "./power";

export enum ProviderSlug {
    IRECHARGE = "irecharge",
    IKEJA_ELECTRIC = "ikeja-electric",
}

export enum BillType {
    POWER = "POWER",
    DATA = "DATA",
    CABLE_TV = "CABLE_TV",
    AIRTIME = "AIRTIME",
}
export interface ProcessBillPaymentOptions {
    billType: TransactionType;
    paymentReference: string;
}

export interface OnBillPurchaseFailure {
    prisma: PrismaService;
    transaction: Transaction;
}

export enum BillEventType {
    BILL_PURCHASE_FAILURE = "bill_purchase_failure",
}

export interface BillPurchaseInitializationHandlerOptions<PurchaseOptions> {
    purchaseOptions: PurchaseOptions;
    user: User;
    billProvider: BillProvider;
    paymentChannel: PaymentChannel;
    wallet?: Wallet;
}

export interface CompleteBillPurchaseUserOptions {
    email: string;
    userType: UserType;
}

export interface CompleteBillPurchaseTransactionOptions {
    id: number;
    billProviderId: number;
    userId: number;
    amount: number;
    senderIdentifier: string; //third party package code
    receiverIdentifier: string; //customer receiver identifier
    billPaymentReference: string;
    paymentStatus: PaymentStatus;
    paymentChannel: PaymentChannel;
}

export interface CompleteBillPurchaseOptions<TransactionOptions> {
    user: CompleteBillPurchaseUserOptions;
    transaction: TransactionOptions;
    billProvider: BillProvider;
    isWalletPayment?: boolean;
}

export interface WalletDebitHandler {
    amount: number;
    walletId: number;
    transactionId: number;
}
