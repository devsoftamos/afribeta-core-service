import { IsEnum, IsString } from "class-validator";

export enum PaymentProvider {
    PAYSTACK = "PAYSTACK",
    WALLET = "WALLET",
}
export enum BillProvider {
    IRECHARGE = "irecharge",
}
export class PurchaseBillDto {
    @IsEnum(PaymentProvider)
    paymentProvider: PaymentProvider;

    @IsEnum(BillProvider)
    billProvider: BillProvider;
}

export class PaymentReferenceDto {
    @IsString()
    reference: string;
}
