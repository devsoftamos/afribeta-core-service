export interface CreateStaticVirtualAccountOptions {
    accountName: string;
    bvn: string;
    collectionAccountNumber: string;
    currencyCode: "NGN";
}

export interface CreateStaticVirtualAccountResponse
    extends CreateStaticVirtualAccountOptions {
    accountNumber: string;
    accountType: number;
}
