import { IRechargeResponse } from "..";

export enum AirtimeProvider {
    MTN = "MTN",
    GLO = "Glo",
    AIRTEL = "Airtel",
    ETISALAT = "Etisalat",
}

export interface VendAirtimeOptions {
    vendor_code: string;
    vtu_network: AirtimeProvider;
    vtu_amount: number;
    vtu_number: string; //The mobile device number.
    vtu_email: string;
    reference_id: string;
    hash: string;
}

export interface VendAirtimeResponse extends IRechargeResponse {
    order: string;
    Receiver: string;
    wallet_balance: number;
    amount: number;
    response_hash: string;
    ref: string;
}
