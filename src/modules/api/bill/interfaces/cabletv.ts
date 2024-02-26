import { CompleteBillPurchaseTransactionOptions } from ".";

export interface FormatCableTVNetworkInput {
    billProviderSlug: string;
    billServiceSlug: string;
    cableTVProvider: {
        name: string;
        icon: string;
    };
}

export interface FormatCableTVNetworkOutput {
    billProvider: string;
    billService: string;
    icon: string;
    name: string;
}

export interface CompleteCableTVPurchaseTransactionOptions
    extends CompleteBillPurchaseTransactionOptions {
    serviceTransactionCode: string;
    serviceTransactionCode2: string;
    billServiceSlug: string;
    receiverIdentifier: string;
}

export interface CompleteCableTVPurchaseOutput {
    vendRef?: string;
}

export interface VerifyCableTVPurchaseData {
    phone: string;
    plan: string;
    smartCardNumber: string;
    network: string;
}
