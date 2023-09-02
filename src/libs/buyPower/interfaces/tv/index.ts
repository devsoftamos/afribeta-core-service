import { PaymentType } from "..";

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
}

export interface VendTVResponseData {
    orderId: string;
    receiptNo: string;
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
}
