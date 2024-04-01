import {
    IsBooleanString,
    IsDateString,
    IsEnum,
    IsNumber,
    IsNumberString,
    IsOptional,
    IsString,
} from "class-validator";

import { TransactionStatus } from "@prisma/client";

export enum VerifyTransactionProvider {
    PAYSTACK = "PAYSTACK",
}

export enum UpdatePayoutStatus {
    APPROVED = "APPROVED",
    DECLINED = "DECLINED",
}

export enum BillPayment {
    AIRTIME_TO_CASH = "AIRTIME_TO_CASH",
    DATA_PURCHASE = "DATA_PURCHASE",
    ELECTRICITY_BILL = "ELECTRICITY_BILL",
    INTERNET_BILL = "INTERNET_BILL",
    CABLETV_BILL = "CABLETV_BILL",
    AIRTIME_PURCHASE = "AIRTIME_PURCHASE",
}

export enum TransactionReportType {
    AIRTIME_PURCHASE = "AIRTIME_PURCHASE",
    ELECTRICITY_BILL = "ELECTRICITY_BILL",
    DATA_PURCHASE = "DATA_PURCHASE",
    CABLETV_BILL = "CABLETV_BILL",
    PAYOUT = "PAYOUT",
    COMMISSION = "COMMISSION",
    WALLET_FUND = "WALLET_FUND",
    SUBAGENT_WALLET_FUND = "SUBAGENT_WALLET_FUND",
    TRANSFER_FUND = "TRANSFER_FUND",
}

export class VerifyTransactionDto {
    @IsString()
    reference: string;

    @IsEnum(VerifyTransactionProvider)
    provider: VerifyTransactionProvider;
}

export class TransactionHistoryDto {
    @IsOptional()
    @IsBooleanString()
    pagination: string;

    @IsOptional()
    @IsNumberString()
    page: string;

    @IsOptional()
    @IsNumberString()
    limit: string;

    @IsOptional()
    @IsEnum(TransactionReportType)
    type: TransactionReportType;
}

export class TransactionHistoryWithFiltersDto {
    @IsOptional()
    @IsString()
    searchName: string;

    @IsOptional()
    @IsBooleanString()
    pagination: string;

    @IsOptional()
    @IsNumberString()
    page: string;

    @IsOptional()
    @IsNumberString()
    limit: string;

    @IsOptional()
    @IsEnum(TransactionReportType)
    type: TransactionReportType;

    @IsOptional()
    @IsDateString()
    startDate: string;

    @IsOptional()
    @IsDateString()
    endDate: string;

    @IsOptional()
    @IsBooleanString()
    airtimeFilter: string;

    @IsOptional()
    @IsBooleanString()
    dataFilter: string;

    @IsOptional()
    @IsBooleanString()
    internetFilter: string;

    @IsOptional()
    @IsBooleanString()
    powerFilter: string;

    @IsOptional()
    @IsBooleanString()
    cableTvFilter: string;

    @IsOptional()
    @IsBooleanString()
    walletFundFilter: string;

    @IsOptional()
    @IsBooleanString()
    bankTransfer: string;

    @IsOptional()
    @IsBooleanString()
    payoutFilter: string;

    @IsOptional()
    @IsBooleanString()
    subAgentWalletFundFilter: string;

    @IsOptional()
    @IsBooleanString()
    successStatusFilter: string;

    @IsOptional()
    @IsBooleanString()
    failedStatusFilter: string;

    @IsOptional()
    @IsBooleanString()
    pendingStatusFilter: string;

    @IsOptional()
    @IsBooleanString()
    reversedStatusFilter: string;
}

export class MerchantTransactionHistoryDto {
    @IsOptional()
    @IsBooleanString()
    pagination: string;

    @IsOptional()
    @IsNumberString()
    page: string;

    @IsOptional()
    @IsNumberString()
    limit: string;

    @IsNumberString()
    userId: string;
}

export class ViewPayoutStatusDto {
    @IsOptional()
    @IsBooleanString()
    pagination: string;

    @IsOptional()
    @IsNumberString()
    page: string;

    @IsOptional()
    @IsNumberString()
    limit: string;

    @IsEnum(TransactionStatus)
    payoutStatus: TransactionStatus;
}

export class UpdatePayoutStatusDto {
    @IsNumber()
    id: number;

    @IsEnum(UpdatePayoutStatus)
    status: UpdatePayoutStatus;
}

export enum QueryTransactionStatus {
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED",
}

export class AdminTransactionHistoryDto {
    @IsOptional()
    @IsBooleanString()
    pagination: string;

    @IsOptional()
    @IsNumberString()
    page: string;

    @IsOptional()
    @IsNumberString()
    limit: string;

    @IsOptional()
    @IsString()
    searchName: string;

    @IsOptional()
    @IsDateString()
    date: string;

    @IsOptional()
    @IsEnum(QueryTransactionStatus)
    status: QueryTransactionStatus;
}

export class SuccessfulTransactionsDto {
    @IsDateString()
    date: Date;
}

export class FetchRecommendedPayoutDto {
    @IsOptional()
    @IsBooleanString()
    pagination: string;

    @IsOptional()
    @IsNumberString()
    page: string;

    @IsOptional()
    @IsNumberString()
    limit: string;
}

export class AllTransactionStatDto {
    @IsDateString()
    date: Date;
}

export class CustomerTransactionHistoryDto {
    @IsOptional()
    @IsBooleanString()
    pagination: string;

    @IsOptional()
    @IsNumberString()
    page: string;

    @IsOptional()
    @IsNumberString()
    limit: string;

    @IsOptional()
    @IsString()
    searchName: string;

    @IsNumberString()
    userId: string;
}
