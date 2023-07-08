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
    meterNumber: number;
    reference: string;
}

export interface GetMeterResponse {
    accessToken: string;
    hash?: string;
}
