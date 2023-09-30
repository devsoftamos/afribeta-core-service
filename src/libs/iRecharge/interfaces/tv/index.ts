import { IRechargeResponse, ResponseFormat } from "..";

export enum TVNetworkProvider {
    DSTV = "DSTV",
    GOTV = "GOTV",
    STARTIMES = "StarTimes",
}

export interface GetTVBouquetOptions {
    tv_network: TVNetworkProvider;
    response_format: ResponseFormat;
}

export interface ListTVBundle {
    title: string;
    network: TVNetworkProvider;
    price: string;
    code: string;
    available: string;
    allowance: string;
}

export interface GetTVBouquetResponse extends IRechargeResponse {
    bundles: ListTVBundle[];
}

export interface GetSmartCardOptions {
    vendor_code: string;
    smartcard_number: string;
    service_code: string; //from get tv bouquet
    reference_id: string;
    tv_network: TVNetworkProvider;
    tv_amount?: number; //startimes only
    response_format: string;
    hash: string;
}

export interface GetSmartCardResponse extends IRechargeResponse {
    access_token: string; //A 12 digit numeric token. This must be provided for your next call to vend_tv
    customer: string;
    customer_number: string; //customer account number
    response_hash: string;
}

export interface VendTVOptions {
    vendor_code: string;
    smartcard_number?: string;
    access_token: string;
    reference_id: string;
    phone: string;
    tv_network: string;
    response_format: string;
    service_code: string;
    email: string;
    hash: string;
}

export interface VendTVResponse extends IRechargeResponse {
    wallet_balance: string;
    order: string;
    response_hash: string;
    ref: string;
}

export interface GetSmartCardInfoHashOptions {
    tvNetwork: TVNetworkProvider;
    smartCardNumber: string;
    serviceCode: string;
    referenceId: string;
}

export interface VendTVHashOptions extends GetSmartCardInfoHashOptions {
    accessToken: string;
}
