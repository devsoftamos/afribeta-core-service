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

export type ComputeTypes =
    | "capped-merchant-md-meter"
    | "default-cap"
    | "capped-subagent-md-meter"
    | "capped-agent-md-meter"
    | "non-capped";
export interface ComputeCommissionOptions<T extends ComputeTypes> {
    type: T;
    percentCommission?: number;
    amount: number;
    subAgentMdMeterCapAmount?: number;
}

export type ComputeCommissionResult<T = ComputeTypes> =
    T extends keyof ComputeCommissionDataMap
        ? ComputeCommissionDataMap[T]
        : never;

export interface SubAgentMdCommissionData {
    merchantAmount: number;
    subAgentAmount: number;
}

export interface GenericCommissionData {
    amount: number;
}

export interface ComputeCommissionDataMap {
    "capped-subagent-md-meter": SubAgentMdCommissionData;
    "capped-merchant-md-meter": GenericCommissionData;
    "capped-agent-md-meter": GenericCommissionData;
    "default-cap": GenericCommissionData;
    "non-capped": GenericCommissionData;
}

export enum BillServiceSlug {
    MTN_AIRTIME = "mtn-airtime",
    GLO_AIRTIME = "glo-airtime",
    ETISALAT_AIRTIME = "etisalat-airtime",
    AIRTEL_AIRTIME = "airtel-airtime",
    MTN_DATA = "mtn-data",
    GLO_DATA = "glo-data",
    ETISALAT_DATA = "etisalat-data",
    AIRTEL_DATA = "airtel-data",
    DSTV = "dstv",
    GOTV = "gotv",
    STARTIMES = "startimes",
    IKEJA_ELECTRIC = "ikeja-electric",
    EKO_ELECTRICITY = "eko-electricity",
    KANO_ELECTRICITY = "kano-electricity",
    PORT_HARCOURT_ELECTRIC = "port-harcourt-electric",
    JOS_ELECTRICITY = "jos-electricity",
    IBADAN_ELECTRICITY = "ibadan-electricity",
    KADUNA_ELECTRIC = "kaduna-electric",
    ABUJA_ELECTRIC = "abuja-electric",
    ENUGU_ELECTRIC = "enugu-electric",
    BENIN_ELECTRIC = "benin-electric",
    ABA_POWER = "aba-power",
    MTN_INTERNET = "mtn-internet",
    GLO_INTERNET = "glo-internet",
    ETISALAT_INTERNET = "etisalat-internet",
    AIRTEL_INTERNET = "airtel-internet",
    SMILE = "smile-internet",
    SPECTRANET = "spectranet-internet",
}
