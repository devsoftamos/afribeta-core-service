import { CompleteBillPurchaseTransactionOptions } from ".";

export interface CompletePowerPurchaseTransactionOptions
    extends CompleteBillPurchaseTransactionOptions {
    serviceTransactionCode: string;
    accountId: string;
}

export interface PowerPurchaseInitializationHandlerOutput {
    paymentReference: string;
}

export interface CompletePowerPurchaseOutput {
    meterToken: string;
    units: string;
}

export interface FormatDiscoOptions {
    billProviderSlug: string;
    prepaidMeterCode: string;
    postpaidMeterCode: string;
    discoProvider: {
        name: string;
    };
}
