import { TransactionStatus, TransactionType } from "@prisma/client";

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
        | "COMMISSION_TRANSFER";
    product?: string;
    amount: number;
    sender?: string;
    beneficiary: string;
    meterType?: string;
    shortDescription: string;
    status: TransactionStatus;
    date: Date;
    token?: string;
    beneficiaryBank?: string;
    beneficiaryBankAccountNumber?: string;
};
