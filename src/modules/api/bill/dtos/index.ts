import {
    IsEnum,
    IsInt,
    IsOptional,
    IsPhoneNumber,
    IsString,
    Length,
} from "class-validator";

export enum PaymentProvider {
    PAYSTACK = "PAYSTACK",
}

export enum MeterType {
    PREPAID = "PREPAID",
    POSTPAID = "POSTPAID",
}

export class PurchasePowerDto {
    @IsEnum(PaymentProvider)
    paymentProvider: PaymentProvider;

    @IsString()
    billProvider: string;

    @IsInt()
    amount: number;

    @IsEnum(MeterType)
    meterType: MeterType;

    @IsString()
    discoType: string;

    @IsString()
    discoCode: string;

    @IsPhoneNumber("NG")
    @Length(11, 11, {
        message: "Phone number must be valid containing 11 digits",
    })
    phone: string;

    @IsString()
    meterNumber: string;

    @IsOptional()
    @IsString()
    narration: string;
}
