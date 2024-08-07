import { VtuNetwork } from "./airtime";
import { DataNetwork } from "./data";
import { Disco } from "./power";
import { CableTVNetwork } from "./tv";

export * as Power from "./power";
export * as Airtime from "./airtime";
export * as Data from "./data";
export * as CableTv from "./tv";

export interface BuyPowerOptions {
    baseUrl: string;
    token: string;
}

export interface BuyPowerResponse<
    D extends Record<string, any> = Record<string, any>
> {
    status: boolean;
    responseCode: number;
    data: D;
}

export type Optional<T, Key extends keyof T> = Omit<T, Key> & Partial<T>;
export type PaymentType = "ONLINE" | "USSD" | "B2B";
export type VendType = "PREPAID" | "POSTPAID" | "RECOVERY";

export interface ReQueryOptions {
    orderId: string;
    delay?: number[];
}

export interface GetPackagePriceListResponseData {
    price: number;
    code: string;
    desc: string;
}

export interface GetPriceListOptions {
    provider: DataNetwork | CableTVNetwork;
    vertical: "DATA" | "TV";
}

export interface WalletBalanceResponseData {
    balance: number;
}

export interface ReQueryResponseData {
    id: number;
    amountGenerated: string;
    disco: Disco | CableTVNetwork | DataNetwork | VtuNetwork;
    debtAmount: string;
    debtRemaining: string;
    orderId: string;
    receiptNo: string;
    tax: string;
    vendTime: string;
    token: string;
    totalAmountPaid: number;
    units: string;
    vendAmount: string;
    vendRef: string;
}
