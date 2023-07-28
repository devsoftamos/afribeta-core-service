import { CompleteBillPurchaseTransactionOptions } from ".";

export interface DataPurchaseInitializationHandlerOutput {
    paymentReference: string;
}

export interface CompleteDataPurchaseTransactionOptions
    extends CompleteBillPurchaseTransactionOptions {
    billServiceSlug: string; //network provider
    serviceTransactionCode: string;
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
    billService: string;
    icon: string;
    name: string;
}

export interface VerifyDataPurchaseData {
    phone: string;
    plan: string;
    networkReference: string;
    network: string;
}
