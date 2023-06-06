export interface PaystackOptions {
    baseUrl: string;
    secretKey: string;
}

export interface AssignDynamicVirtualAccountWithValidationOptions {
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    phone: string;
    preferred_bank: "wema-bank" | "access-bank";
    country: "NG";
    account_number: string;
    bank_code: string;
    bvn: string;
}

export interface PaystackResponse<D = undefined> {
    status: boolean;
    message: string;
    data: D;
}
