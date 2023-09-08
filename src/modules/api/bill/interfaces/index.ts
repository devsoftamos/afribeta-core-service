import {
    BillProvider,
    BillService,
    PaymentChannel,
    PaymentStatus,
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
    BUYPOWER = "buypower",
}

export enum BillProviderSlug { //exclude ikeja electric
    IRECHARGE = "irecharge",
    BUYPOWER = "buypower",
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
    billService?: BillService;
}

export interface CompleteBillPurchaseUserOptions {
    email: string;
    userType: UserType;
    phone?: string;
}

export interface CompleteBillPurchaseTransactionOptions {
    id: number;
    billProviderId: number;
    userId: number;
    amount: number;
    senderIdentifier: string; //customer receiver identifier
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
    transactionId: number;
}
export type BillPaymentFailure = BillPurchaseFailure;
export interface ComputeBillCommissionOptions {
    transactionId: number;
    userType: UserType;
}

export type PayBillCommissionOptions = ComputeBillCommissionOptions;

export interface BillEventMap {
    "payment-failure": BillPaymentFailure;
    "bill-purchase-failure": BillPurchaseFailure;
    "compute-bill-commission": ComputeBillCommissionOptions;
    "pay-bill-commission": PayBillCommissionOptions;
}

export type VerifyPurchase<TBillData> = {
    status: string;
    paymentStatus: string;
    paymentReference: string;
    transactionId: string;
    amount: number;
    serviceCharge: number;
    paymentChannel: string;
    user: {
        firstName: string;
        lastName: string;
    };
    createdAt: Date;
    updatedAt: Date;
} & TBillData;
