import { CompleteBillPurchaseTransactionOptions } from ".";

export interface FormatAirtimeNetworkOutput {
    billProvider: string;
    billService: string;
    icon: string;
    name: string;
}

export interface FormatAirtimeNetworkInput {
    billProviderSlug: string;
    billServiceSlug: string;
    airtimeProvider: {
        name: string;
        icon: string;
    };
}

export interface CompleteAirtimePurchaseTransactionOptions
    extends CompleteBillPurchaseTransactionOptions {
    billServiceSlug: string; //network provider
}

export interface CompleteAirtimePurchaseOutput {
    networkProviderReference: string;
    amount: number;
    phone: string;
}

export interface VerifyAirtimePurchaseData {
    phone: string;
    networkReference: string;
    network: string;
}
