export interface CreateReservedVirtualAccountOptions {
    account_name: string;
    bvn: string;
}

export interface CreateReservedVirtualAccountResponse {
    account_number: string;
    account_name: string;
    bvn: string;
}
