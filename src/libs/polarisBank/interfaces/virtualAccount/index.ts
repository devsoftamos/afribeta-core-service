export interface CreateVirtualAccountOptions {
    accountName: string;
    requestRef: string;
    bvn: string;
}

export interface CreateVirtualAccountResponse {
    accountNumber: string;
    accountType: number;
}
