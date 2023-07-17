import { CompleteBillPurchaseTransactionOptions } from ".";

export interface DataPurchaseInitializationHandlerOutput {
    paymentReference: string;
}

export interface CompleteDataPurchaseTransactionOptions
    extends CompleteBillPurchaseTransactionOptions {
    provider: string; //network provider
}

export interface CompleteDataPurchaseOutput {
    networkProviderReference: string;
}
