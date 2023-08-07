export interface ListBanks {
    name: string;
    code: string;
}

export interface ResolveAccountOptions {
    accountNumber: string;
    bankCode: string;
}

export interface ResolveAccountResponse {
    accountName: string;
    accountNumber: string;
}

export interface InitializeTransferOptions {
    accountNumber: string;
    bankCode: string;
    amount: number;
    accountName: string;
    serviceCharge: number;
    bankName: string;
    userId: number;
    userType: string;
}

export type VerifyTransactionStatus = "success" | "cancelled" | "failed";
export interface VerifyTransactionResponse {
    status: VerifyTransactionStatus;
}

export type CreateVirtualAccountOptions<T = Record<string, any>> = {
    bvn: string;
    accountName: string;
    bankName?: string;
} & T;

export type GTBankExtraVirtualAccountOptions = {
    phone: string;
    userIdentifier: string;
};

export interface CreateVirtualAccountResponse {
    accountName: string;
    accountNumber: string;
}

export interface BankDetails {
    name: string;
    slug: string;
}
