export enum MeterType {
    PREPAID = "PREPAID",
    POSTPAID = "POSTPAID",
}

export interface FormattedElectricDiscoData {
    discoType: string;
    meterType: MeterType;
    billProvider: string;
    code: string;
    minValue: number;
    maxValue: number;
}

export interface GetMeterInfoOptions {
    discoCode: string;
    meterNumber: string;
    reference: string;
}

export interface GetMeterResponse {
    accessToken: string;
    hash?: string;
    customer: {
        name: string;
        address: string;
        util: string;
        minimumAmount: number;
    };
}

export interface VendPowerOptions {
    accessToken: string;
    discoCode: string;
    accountId: string;
    email: string;
    referenceId: string;
    amount: number;
    meterNumber: string;
}

export interface VendPowerResponse {
    units: string;
    meterToken: string;
}
