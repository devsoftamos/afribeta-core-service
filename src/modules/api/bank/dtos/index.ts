import { IsEnum, IsNumberString, IsString, Length } from "class-validator";

export enum BankProvider {
    PAYSTACK = "paystack",
    PROVIDUS = "providus",
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

    @IsNumberString()
    @Length(10, 10, { message: "Account number must be 10 characters" })
    accountNumber: string;

    @IsString()
    accountName: string;
}
