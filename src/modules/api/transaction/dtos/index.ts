import {
    IsBooleanString,
    IsEmail,
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
    @IsString()
    paymentReference: string;

    @IsEnum(TransactionStatus)
    status: TransactionStatus;
}
