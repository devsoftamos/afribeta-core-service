import { IsEnum, IsString, Length } from "class-validator";

export enum BankProvider {
    PAYSTACK = "paystack",
    PROVIDUS = "providus",
}

export class GetPaymentProviderBanksDto {
    @IsEnum(BankProvider)
    provider: BankProvider;
}

export class ResolveBankAccountDto {
    @IsEnum(BankProvider)
    provider: BankProvider;

    @IsString()
    accountNumber: string;

    @IsString()
    bankCode: string;
}

export class CreateBankDto {
    @IsString()
    bankName: string;

    @IsString()
    bankCode: string;

    @IsString()
    @Length(10, 10)
    accountNumber: string;

    @IsString()
    accountName: string;
}
