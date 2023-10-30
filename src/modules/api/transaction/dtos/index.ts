import {
    IsBooleanString,
    IsDateString,
    IsEnum,
    IsNumber,
    IsNumberString,
    IsOptional,
    IsPhoneNumber,
    IsString,
    Length,
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
    transactionId: string;

    @IsOptional()
    @IsPhoneNumber("NG")
    @Length(11, 11, {
        message: "Phone number must be valid containing 11 digits",
    })
    phone: string;

    @IsOptional()
    @IsString()
    meterNo: string;

    @IsOptional()
    @IsDateString()
    date: string;
}
