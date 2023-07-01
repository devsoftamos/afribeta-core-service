export enum MeterType {
    PREPAID = "PREPAID",
    POSTPAID = "POSTPAID",
}
export enum DISCO_PROVIDER {
    IRECHARGE = "IRECHARGE",
    IKEJA_ELECTRIC = "IKEJA_ELECTRIC",
}
export interface FormattedElectricDiscoData {
    discoType: string;
    meterType: MeterType;
    provider: DISCO_PROVIDER;
    code: string;
    minValue: number;
    maxValue: number;
}
