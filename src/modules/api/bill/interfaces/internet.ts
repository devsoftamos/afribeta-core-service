import { CompleteBillPurchaseTransactionOptions } from ".";

export interface FormatInternetBundleNetworkInput {
    billProviderSlug: string;
    billServiceSlug: string;
    internetProvider: {
        name: string;
        icon: string;
    };
}

export interface FormatInternetBundleNetworkOutput {
    billProvider: string;
    billService: string;
    icon: string;
    name: string;
}

export interface InternetPurchaseInitializationHandlerOutput {
    paymentReference: string;
}

export interface CompleteInternetPurchaseTransactionOptions
    extends CompleteBillPurchaseTransactionOptions {
    billServiceSlug: string; //network provider
    serviceTransactionCode: string;
}

export interface CompleteInternetPurchaseOutput {
    networkProviderReference: string;
    amount: number;
    phone: string;
}

export interface VerifyInternetPurchaseData {
    phone: string;
    plan: string;
    networkReference: string;
    network: string;
}
