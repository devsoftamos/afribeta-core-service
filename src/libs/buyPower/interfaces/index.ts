import { DataNetwork } from "./data";
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
export type PaymentType = "ONLINE" | "USSD";

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
