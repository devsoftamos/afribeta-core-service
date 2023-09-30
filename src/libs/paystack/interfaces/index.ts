export * from "./virtualAccount";
export * from "./bank";

export interface PaystackOptions {
    baseUrl: string;
    secretKey: string;
}

export type PaystackPaymentChannel =
    | "card"
    | "bank"
    | "ussd"
    | "qr"
    | "mobile_money"
    | "bank_transfer"
    | "dedicated_nuban";

export interface PaystackResponse<D = undefined> {
    status: boolean;
    message: string;
    data: D;
}
