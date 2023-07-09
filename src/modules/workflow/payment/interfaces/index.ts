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
}

export type VerifyTransactionStatus = "success" | "cancelled" | "failed";
export interface VerifyTransactionResponse {
    status: VerifyTransactionStatus;
}

export interface CreateVirtualAccountOptions {
    bvn: string;
    accountName: string;
    bankName?: string;
}

export interface CreateVirtualAccountResponse {
    accountName: string;
    accountNumber: string;
}
