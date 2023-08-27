import {
    IsBooleanString,
    IsDateString,
    IsEnum,
    IsInt,
    IsNumber,
    IsNumberString,
    IsOptional,
    IsString,
    Length,
} from "class-validator";

export class InitiateWalletCreationDto {
    @IsNumberString()
    @Length(10, 10, { message: "Please input a valid Bank Account Number" })
    accountNumber: string;

    @IsNumberString()
    @Length(11, 11, {
        message: "Please input a valid Bank Verification Number",
    })
    bvn: string;

    @IsString()
    bankCode: string;
}

enum PaymentChannel {
    PAYSTACK_CHANNEL = "PAYSTACK_CHANNEL",
}
export class InitializeWalletFundingDto {
    @IsInt()
    amount: number;

    @IsEnum(PaymentChannel)
    paymentChannel: PaymentChannel;
}

export enum PaymentProvider {
    PAYSTACK = "PAYSTACK",
    PROVIDUS = "PROVIDUS",
}

export enum WalletBallanceSource {
    MAIN = "MAIN",
    COMMISSION = "COMMISSION",
}
export class InitializeWithdrawalDto {
    @IsEnum(PaymentProvider)
    paymentProvider: PaymentProvider;

    @IsString()
    bankName: string;

    @IsString()
    accountName: string;

    @IsString()
    accountNumber: string;

    @IsInt()
    amount: number;

    @IsInt()
    serviceCharge: number;

    @IsString()
    bankCode: string;
}

export class TransferToOtherWalletDto {
    @IsString()
    walletNumber: string;

    @IsInt()
    amount: number;
}

export class VerifyWalletDto {
    @IsString()
    walletNumber: string;
}

export class CreateVendorWalletDto {
    @IsNumberString()
    @Length(11, 11, {
        message: "Please input a valid Bank Verification Number",
    })
    bvn: string;
}

export class PaymentReferenceDto {
    @IsString()
    reference: string;
}

export class ListWalletTransactionDto {
    @IsOptional()
    @IsBooleanString()
    pagination: string;

    @IsOptional()
    @IsNumberString()
    page: number;

    @IsOptional()
    @IsNumberString()
    limit: number;

    @IsOptional()
    @IsDateString()
    startDate: string;

    @IsOptional()
    @IsDateString()
    endDate: string;
}

export class FundSubAgentDto {
    @IsInt()
    agentId: number;

    @IsNumber()
    amount: number;
}

export class RequestWalletFundingDto {
    @IsInt()
    amount: number;
}

export enum AUTHORIZE_WALLET_FUND_REQUEST_TYPE {
    APPROVE = "APPROVE",
    DECLINE = "DECLINE",
}
export class AuthorizeFundRequestDto {
    @IsInt()
    notificationId: number;

    @IsEnum(AUTHORIZE_WALLET_FUND_REQUEST_TYPE)
    authorizeType: AUTHORIZE_WALLET_FUND_REQUEST_TYPE;
}

export class FundWalletFromCommissionBalanceDto extends RequestWalletFundingDto {}

export class PayoutRequestDto extends RequestWalletFundingDto {}
