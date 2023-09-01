export enum Disco {
    ABUJA = "ABUJA",
    EKO = "EKO",
    IKEJA = "IKEJA",
    IBADAN = "IBADAN",
    ENUGU = "ENUGU",
    PH = "PH",
    JOS = "JOS",
    KADUNA = "KADUNA",
    KANO = "KANO",
    BH = "BH",
}

export enum MeterType {
    PREPAID = "PREPAID",
    POSTPAID = "POSTPAID",
}

export interface GetMeterInfoOptions {
    meter: string;
    disco: Disco;
    vendType: MeterType;
    vertical?: "ELECTRICITY";
    orderId: boolean;
}

export interface GetMeterInfoResponseData {
    discoCode: Disco;
    vendType: MeterType;
    meterNo: string;
    minVendAmount: number;
    maxVendAmount: number;
    responseCode: number;
    outstanding: number;
    debtRepayment: number;
    name: string;
    address: string;
    tariff: string;
    tariffClass: string;
}

export interface VendPowerOptions {
    orderId: number;
}
