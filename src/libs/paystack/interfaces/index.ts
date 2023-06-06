export * from "./virtualAccount";
export * from "./bank";

export interface PaystackOptions {
    baseUrl: string;
    secretKey: string;
}

export interface PaystackResponse<D = undefined> {
    status: boolean;
    message: string;
    data: D;
}
