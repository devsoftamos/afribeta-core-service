import { MeterAccountType } from "@prisma/client";
import { CompleteBillPurchaseTransactionOptions } from ".";

export type IkejaElectricExtraPayload = {
    sgc?: string;
    outstandingDebt?: number;
    vat?: number;
    remainingDebt?: number;
    orgName?: string;
    orgNumber?: string;
    costOfUnit?: number;
    fixedCharge?: number;
    rate?: number;
    penalty?: number;
    lor?: number;
    reconnectionFee?: number;
    installationFee?: number;
    administrativeCharge?: number;
    currentCharge?: number;
    meterCost?: number;
    tariffName?: string;
};
export type CompletePowerPurchaseTransactionOptions = {
    serviceTransactionCode: string;
    serviceTransactionCode2: string;
    accountId: string;
    meterType: string;
    billServiceSlug: string;
    meterAccountType: MeterAccountType;
} & CompleteBillPurchaseTransactionOptions;

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

export interface VerifyPowerPurchaseData {
    disco: string;
    meter: {
        type: string;
        accountId: string;
        meterNumber: string;
        token: string;
        units: string;
    };
    ikejaElectric?: IkejaElectricExtraPayload;
}
