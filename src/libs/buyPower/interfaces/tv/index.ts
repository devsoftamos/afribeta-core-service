import { PaymentType, VendType } from "..";

export enum CableTVNetwork {
    DSTV = "DSTV",
    GOTV = "GOTV",
    STARTIMES = "STARTIMES",
}

export interface VendTVOptions {
    orderId: string;
    meter: string;
    disco: CableTVNetwork;
    phone: string;
    paymentType: PaymentType;
    vertical?: "TV";
    amount: number;
    email?: string;
    name?: string;
    tariffClass: string;
    vendType: VendType;
}

export interface VendTVResponseData {
    orderId: string;
    receiptNo: number;
    totalAmountPaid: number;
    disco: CableTVNetwork;
    vendRef: number;
}

export interface VendTVInputOptions {
    smartCardNumber: string;
    paymentType?: PaymentType;
    network: CableTVNetwork;
    orderId: string;
    phone: string;
    vertical?: "TV";
    amount: number;
    email?: string;
    name?: string;
    tariffClass: string;
    vendType?: VendType;
}

export interface GetSmartCardInputOptions {
    smartCardNumber: string;
    vertical?: "TV";
    network: CableTVNetwork;
    orderId?: string;
}

export interface GetSmartCardOptions {
    meter: string;
    vertical?: "TV";
    disco: CableTVNetwork;
    orderId?: string;
}

export interface GetSmartCardResponseData {
    name: string;
    address: string;
}
