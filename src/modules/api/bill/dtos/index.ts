import { IsEnum, IsString } from "class-validator";

export enum PaymentProvider {
    PAYSTACK = "PAYSTACK",
    WALLET = "WALLET",
}
export class PurchaseBillDto {
    @IsEnum(PaymentProvider)
    paymentProvider: PaymentProvider;

    @IsString()
    billProvider: string;
}

export class PaymentReferenceDto {
    @IsString()
    reference: string;
}
