import {
    MeterAccountType,
    PaymentChannel,
    PaymentStatus,
    TransactionStatus,
    TransactionType,
    UserType,
} from "@prisma/client";
import { IkejaElectricExtraPayload, MeterType } from "../../bill/interfaces";

export enum TransactionShortDescription {
    WALLET_FUNDED = "Wallet Funded",
    TRANSFER_FUND = "Transferred Fund",
    ELECTRICITY_PAYMENT = "Electricity Payment",
    DATA_PURCHASE = "Data Purchase",
    AIRTIME_PURCHASE = "Airtime Purchase",
    INTERNET_PURCHASE = "Internet Purchase",
    CABLE_TV_PAYMENT = "Cable TV Payment",
    COMMISSION_PAID = "Commission Paid",
    PAYOUT = "Payout",
    BILL_PAYMENT_REFUND = "Failed Bill Payment Refund",
    BANK_TRANSFER_REFUND = "Failed Bank Transfer Refund",
}

export enum TransferServiceProvider {
    PAYSTACK = "PAYSTACK",
}

export type TransactionDetailResponse = {
    type:
        | TransactionType
        | "WALLET_TRANSFER"
        | "COMMISSION"
        | "DEPOSIT"
        | "BANK_TRANSFER"
        | "COMMISSION_TRANSFER"
        | "REFUND_DEPOSIT";
    product?: string;
    amount: number;
    sender?: string;
    beneficiary: string;
    meterType?: string;
    shortDescription: string;
    status: TransactionStatus;
    date: Date;
    transactionId: string;
    token?: string;
    name?: string;
    address?: string;
    beneficiaryBank?: string;
    beneficiaryBankAccountNumber?: string;
    icon?: string;
    email?: string;
    ikejaElectric?: IkejaElectricExtraPayload;
    customerName?: string;
    beneficiaryName?: string;
};

export interface IkejaElectricReport {
    id: number;
    transactionId: string;
    paymentStatus: PaymentStatus;
    transactionStatus: TransactionStatus;
    amount: number;
    commission: number;
    productName: string;
    agentName: string;
    meterNumber: string;
    customerName: string;
    demandType: MeterAccountType;
    date: Date;
    meterType: MeterType;
}

export interface IkejaElectricReportDownload {
    transactionId: string;
    paymentStatus: PaymentStatus;
    transactionStatus: TransactionStatus;
    amount: number;
    productName: string;
    agentName: string;
    meterNumber: string;
    customerName: string;
    demandType: MeterAccountType;
    date: string;
    meterType: MeterType;
    customerAddress: string;
    agentEmail: string;
    receiptNo: string;
    commission: number | string;
}

export type IkejaElectricCSVField = {
    id: keyof IkejaElectricReportDownload;
    title: string;
};

export type ReportDownloadTransactionType =
    | Omit<TransactionType, "WALLET_FUND">
    | "INTRA_WALLET_TRANSFER"
    | "COMMISSION_DEPOSIT"
    | "WALLET_FUND_BANK_DEPOSIT"
    | "WALLET_WITHDRAWAL"
    | "WALLET_COMMISSION_TRANSFER"
    | "REFUND_DEPOSIT";

export interface GeneralReportDownload {
    transactionId: string;
    transactionType: ReportDownloadTransactionType;
    amount: number;
    commission: number;
    transactionStatus: TransactionStatus;
    paymentStatus: PaymentStatus;
    serviceCharge: number | string;
    name: string;
    email: string;
    userType: UserType;
    afribCommission: number | string;
    date: string;
    productName: string;
    paymentChannel: PaymentChannel;
}

export type GeneralReportCSVField = {
    id: keyof GeneralReportDownload;
    title: string;
};
