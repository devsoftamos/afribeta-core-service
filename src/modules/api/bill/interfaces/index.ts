import { PrismaService } from "@/modules/core/prisma/services";
import { Transaction, TransactionType } from "@prisma/client";
export * from "./power";

export enum ProviderSlug {
    IRECHARGE = "irecharge",
    IKEJA_ELECTRIC = "ikeja-electric",
}

export enum BillType {
    POWER = "POWER",
    DATA = "DATA",
    CABLE_TV = "CABLE_TV",
    AIRTIME = "AIRTIME",
}
export interface ProcessBillPaymentOptions {
    billType: TransactionType;
    paymentReference: string;
}

export interface OnBillPurchaseFailure {
    prisma: PrismaService;
    transaction: Transaction;
}

export enum BillEventType {
    BILL_PURCHASE_FAILURE = "bill_purchase_failure",
}
