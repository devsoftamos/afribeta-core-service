import { PaymentType } from "..";

export enum VtuNetwork {
    MTN = "MTN",
    GLO = "GLO",
    AIRTEL = "AIRTEL",
    "9MOBILE" = "9MOBILE",
}

export interface VendAirtimeOptions {
    orderId: string;
    meter: string;
    disco: VtuNetwork;
    phone: string;
    paymentType: PaymentType;
    vertical?: "VTU";
    amount: number;
    email?: string;
    name?: string;
}

export interface VendAirtimeResponseData {
    orderId: string;
    receiptNo: string;
    totalAmountPaid: number;
    disco: VtuNetwork;
    vendRef: number;
}
