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
    receiptNo: number;
    totalAmountPaid: number;
    disco: VtuNetwork;
    vendRef: number;
}

export interface VendAirtimeInputOptions {
    orderId: string;
    vtuNumber: string;
    vtuNetwork: VtuNetwork;
    phone: string;
    paymentType?: PaymentType;
    vertical?: "VTU";
    amount: number;
    email?: string;
    name?: string;
}
