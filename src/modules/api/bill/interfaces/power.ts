import { CompleteBillPurchaseTransactionOptions } from ".";

export interface CompletePowerPurchaseTransactionOptions
    extends CompleteBillPurchaseTransactionOptions {
    serviceTransactionCode: string;
    accountId: string;
}

export interface CustomerMeterInfo {
    name: string;
    address: string;
    util: string;
    minimumAmount: number;
}
export interface PowerPurchaseInitializationHandlerOutput {
    paymentReference: string;
    customer: CustomerMeterInfo;
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
