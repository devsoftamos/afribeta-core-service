export enum TransactionShortDescription {
    WALLET_FUNDED = "Wallet Funded",
    TRANSFER_FUND = "Transferred Fund",
}

export interface TransactionIdOption {
    type: "transaction" | "reference";
}

export enum TransferServiceProvider {
    PAYSTACK = "PAYSTACK",
}
