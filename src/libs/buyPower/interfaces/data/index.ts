import { PaymentType, VendType } from "..";

export enum DataNetwork {
    MTN = "MTN",
    GLO = "GLO",
    AIRTEL = "AIRTEL",
    "9MOBILE" = "9MOBILE",
}

export interface VendDataOptions {
    orderId: string;
    meter: string;
    disco: DataNetwork;
    phone: string;
    paymentType: PaymentType;
    vertical?: "DATA";
    amount: number;
    email?: string;
    name?: string;
    tariffClass: string;
    vendType: VendType;
}

export interface VendDataResponseData {
    orderId: string;
    receiptNo: number;
    totalAmountPaid: number;
    disco: DataNetwork;
    vendRef: number;
}

export interface VendDataInputOptions {
    vtuNumber: string;
    paymentType?: PaymentType;
    network: DataNetwork;
    orderId: string;
    phone: string;
    vertical?: "DATA";
    amount: number;
    email?: string;
    name?: string;
    tariffClass: string;
    vendType?: VendType;
}
