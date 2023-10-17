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

export enum TransactionReportType {
    AIRTIME = "AIRTIME_PURCHASE",
    ELECTRICITY = "ELECTRICITY_BILL",
    DATA = "DATA_PURCHASE",
    CABLETV = "CABLETV_BILL",
    PAYOUT = "PAYOUT",
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

    @IsEnum(TransactionStatus)
    payoutStatus: TransactionStatus;
}

export class UpdatePayoutStatusDto {
    @IsNumber()
    id: number;

    @IsEnum(UpdatePayoutStatus)
    status: UpdatePayoutStatus;
}

export class SuccessfulTransactionsDto {
    @IsDateString()
    date: string;
}
