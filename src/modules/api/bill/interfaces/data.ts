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

export interface FormatDataBundleNetworkInput {
    billProviderSlug: string;
    billServiceSlug: string;
    dataProvider: {
        name: string;
        icon: string;
    };
}

export interface FormatDataBundleNetworkOutput {
    billProvider: string;
    icon: string;
    name: string;
    slug: string;
}
