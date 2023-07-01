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
