import { IRechargeResponse, ResponseFormat } from "..";

export enum DataBundleProvider {
    SMILE = "Smile",
    MTN = "MTN",
    AIRTEL = "Airtel",
    ETISALAT = "Etisalat",
    GLO = "Glo",
    SPECTRANET = "Spectranet",
}
export interface GetDataBundleOptions {
    response_format: ResponseFormat;
    data_network: DataBundleProvider;
}

export interface ListDataBundle {
    code: string;
    title: string;
    price: string;
    validity: string;
}

export interface GetDataBundleResponse extends IRechargeResponse {
    bundles: ListDataBundle[];
}

//vend data
export interface VendDataOptions {
    vendor_code: string;
    vtu_network: DataBundleProvider;
    vtu_data: string; //code attribute from list data bundle
    vtu_number: string;
    vtu_email: string;
    reference_id: string;
    hash: string;
    response_format: ResponseFormat;
}

export interface VendDataResponse extends IRechargeResponse {
    order: string;
    receiver: string; //phone number
    wallet_balance: number;
    amount: number;
    amount_paid: number;
    ref: string;
    response_hash: string;
}

export interface GetSmileDeviceInfoHashOptions {
    receiver: string;
}

export interface VendDataHashOptions {
    referenceId: string;
    vtuNumber: string;
    vtuNetwork: DataBundleProvider;
    vtuData: string;
}

export interface GetSmileDeviceInfoOptions {
    receiver: string;
    hash: string;
}

export interface GetSmileDeviceInfoResponse extends IRechargeResponse {
    customer: any;
    response_hash: string;
}
