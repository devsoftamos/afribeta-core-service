export * from "./power";

export type Optional<T, Key extends keyof T> = Omit<T, Key> & Partial<T>;

export interface IRechargeOptions {
    vendorCode: string;
    publicKey: string;
    privateKey: string;
    baseUrl: string;
}

export type ResponseFormat = "String" | "json" | "xml";

export type IRechargeStatusCode =
    | "00"
    | "-1"
    | "02"
    | "03"
    | "04"
    | "05"
    | "06"
    | "11"
    | "12"
    | "13"
    | "14"
    | "15"
    | "17"
    | "19"
    | "20"
    | "40"
    | "41"
    | "42"
    | "43"
    | "44"
    | "50"
    | "51";

export interface IRechargeResponse {
    message: string;
    status: IRechargeStatusCode;
}

export type RequestOptions<T> = Omit<T, "vendor_code" | "response_format">;

//vend status
export enum IRechargeVendType {
    POWER = "power",
    AIRTIME = "airtime",
    DATA = "data",
    TV = "tv",
}

export interface VendStatusOptions {
    vendor_code: string;
    access_token: string;
    hash: string;
    type: IRechargeVendType;
    response_format: string;
}

export type VendStatusCode = "00" | "01" | "02" | "03";
export interface VendStatusResponse {
    status: IRechargeStatusCode;
    vend_status: string;
    vend_code: VendStatusCode;
    response_hash: string;
}

//wallet
export interface GetWalletBalanceOptions {
    vendor_code: string;
    response_format: string;
}

export interface GetWalletBalanceResponse {
    status: IRechargeStatusCode;
    wallet_balance: string;
}

export interface VendStatusHashOptions {
    accessToken: string;
}
