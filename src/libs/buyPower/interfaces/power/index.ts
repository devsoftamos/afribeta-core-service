import { PaymentType } from "..";

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
    orderId?: boolean;
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
    orderId: string;
    meter: string;
    disco: Disco;
    phone: string;
    paymentType: PaymentType;
    vendType: MeterType;
    vertical?: "ELECTRICITY";
    amount: number;
    email?: string;
    name?: string;
}

export interface VendPowerResponseData {
    id: number;
    amountGenerated: number;
    tariff: null;
    debtAmount: number;
    debtRemaining: number;
    disco: Disco;
    orderId: string;
    receiptNo: number;
    tax: number;
    vendTime?: string;
    token: string;
    totalAmountPaid: number;
    units: string;
    vendAmount: number;
    vendRef: string;
    responseCode: number;
    responseMessage: string;
    demandCategory?: "NMD" | "MD";
    assetProvider?: string;
}
