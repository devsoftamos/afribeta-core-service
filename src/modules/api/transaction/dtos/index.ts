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

    @IsOptional()
    @IsEnum(TransactionStatus)
    payoutStatus: TransactionStatus;
}

export class UpdatePayoutStatusDto {
    @IsNumber()
    id: number;

    @IsEnum(UpdatePayoutStatus)
    status: UpdatePayoutStatus;
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
}

export class SuccessfulTransactionsDto {
    @IsDateString()
    date: Date;
}
