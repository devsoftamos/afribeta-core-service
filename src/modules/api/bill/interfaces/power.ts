import { CompleteBillPurchaseTransactionOptions } from ".";

export interface CompletePowerPurchaseTransactionOptions
    extends CompleteBillPurchaseTransactionOptions {
    serviceTransactionCode: string;
    serviceTransactionCode2: string;
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
    billServiceSlug: string;
    prepaidMeterCode: string;
    postpaidMeterCode: string;
    discoProvider: {
        name: string;
        icon: string;
    };
}

export enum MeterType {
    PREPAID = "PREPAID",
    POSTPAID = "POSTPAID",
}
interface DiscoMeterOptions {
    type: MeterType;
    code: string;
}
export interface FormattedElectricDiscoData {
    discoType: string;
    icon: string;
    billProvider: string;
    billService: string;
    meter: DiscoMeterOptions[];
}
