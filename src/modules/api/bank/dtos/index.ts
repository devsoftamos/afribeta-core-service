import { IsEnum } from "class-validator";

export enum BankProvider {
    PAYSTACK = "paystack",
    PROVIDUS = "providus",
}

export class GetPaymentProviderBanksDto {
    @IsEnum(BankProvider)
    provider: BankProvider;
}
