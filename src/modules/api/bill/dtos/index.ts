import {
    IsEnum,
    IsInt,
    IsNumberString,
    IsOptional,
    IsPhoneNumber,
    IsString,
    Length,
} from "class-validator";

export enum PaymentSource {
    WALLET = "WALLET",
    PAYSTACK = "PAYSTACK",
}

export enum MeterType {
    PREPAID = "PREPAID",
    POSTPAID = "POSTPAID",
}

export class BuyPowerDto {
    @IsEnum(PaymentSource)
    paymentSource: PaymentSource;

    @IsInt()
    billProvider: string;

    @IsInt()
    amount: number;

    @IsEnum(MeterType)
    meterType: MeterType;

    @IsString()
    discoType: string;

    @IsString()
    serviceCode: string;

    @IsPhoneNumber("NG")
    @Length(11, 11, { message: "Phone number must be 11 digits" })
    phone: string;

    @IsInt()
    meterNumber: number;

    @IsOptional()
    @IsString()
    narration: string;
}
