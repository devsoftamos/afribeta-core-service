import { IsEnum, IsString } from "class-validator";

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
