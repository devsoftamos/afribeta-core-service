import { IsEnum, IsString } from "class-validator";

export enum VerifyTransactionProvider {
    PAYSTACK = "PAYSTACK",
}

export class VerifyTransactionDto {
    @IsString()
    reference: string;

    @IsEnum(VerifyTransactionProvider)
    provider: VerifyTransactionProvider;
}
