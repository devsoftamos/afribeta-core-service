import { IRechargeResponse, ResponseFormat } from "..";

export enum DiscoType {
    AEDC_PREPAID = "AEDC",
    AEDC_POSTPAID = "AEDC_Postpaid",
    BEDC_PREPAID = "BEDC",
    BEDC_POSTPAID = "BEDC_Postpaid",
    IKEJA_ELECTRIC_BILL_PAYMENT = "Ikeja_Electric_Bill_Payment",
    IKEJA_TOKEN_PURCHASE = "Ikeja_Token_Purchase",
    EKO_PREPAID = "Eko_Prepaid",
    EKO_POSTPAID = "Eko_Postpaid",
    IBADAN_DISCO_PREPAID = "Ibadan_Disco_Prepaid",
    KANO_ELECTRICITY_DISCO = "Kano_Electricity_Disco",
    KADUNA_ELECTRICITY_DISCO = "Kaduna_Electricity_Disco",
    KADUNA_ELECTRICITY_DISCO_POSTPAID = "Kaduna_Electricity_Disco_Postpaid",
    PHED_ELECTRICITY = "PhED_Electricity",
    ENUGU_ELECTRICITY_DISTRIBUTION_PREPAID = "Enugu_Electricity_Distribution_Prepaid",
}

//Get meter info
export interface GetMeterInfoOptions {
    vendor_code: string;
    meter: number;
    reference_id: string;
    disco: string;
    response_format: ResponseFormat;
    hash: string;
}

export interface GetMeterInfoResponse extends IRechargeResponse {
    access_token: string;
    customer: string;
    response_hash: string;
}

//vend power
export interface VendPowerOptions {
    vendor_code: string;
    meter: string;
    reference_id: string;
    disco: string; //gotten from the code attribute of the get_electric_disco request
    access_token: string; //from get meter info response
    amount: number;
    phone: number;
    email: string;
    hash: string;
    response_format: ResponseFormat;
}

export interface VendPowerResponse extends IRechargeResponse {
    meter_token: number;
    units: number;
    amount: number;
    address: string;
    wallet_balance: number;
    ref: string;
    response_hash: string;
}

export interface DiscoBundleData {
    id: string;
    code: string;
    description: string;
    minimum_value: string;
    maximum_value: string;
}

export interface GetElectricDiscosResponse extends IRechargeResponse {
    bundles: DiscoBundleData[];
}

export interface GetMeterInfoHashOptions {
    referenceId: string;
    meterNumber: string;
    disco: string;
}

export interface VendPowerHashOptions extends GetMeterInfoHashOptions {
    amount: string;
    accessToken: string;
}
