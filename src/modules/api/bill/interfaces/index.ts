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
export * from "./data";

export enum BillProviderSlugForPower {
    IRECHARGE = "irecharge",
    IKEJA_ELECTRIC = "ikeja-electric",
}

export enum BillProviderSlug { //exclude ikeja electric
    IRECHARGE = "irecharge",
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

export interface WalletChargeHandler {
    amount: number;
    walletId: number;
    transactionId: number;
}

export interface BillPurchaseFailure {
    transaction: Transaction;
}
export type BillPaymentFailure = BillPurchaseFailure;

export interface BillEventMap {
    "payment-failure": BillPaymentFailure;
    "bill-purchase-failure": BillPurchaseFailure;
}
