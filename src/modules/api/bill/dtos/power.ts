import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsPhoneNumber,
    IsPositive,
    IsString,
    Length,
} from "class-validator";
import { PaymentProvider } from ".";
import { BillProviderSlugForPower, MeterType } from "../interfaces";
import { MeterAccountType } from "@prisma/client";

export class PurchasePowerDto {
    @IsEnum(PaymentProvider)
    paymentProvider: PaymentProvider;

    @IsEnum(BillProviderSlugForPower)
    billProvider: BillProviderSlugForPower;

    @IsString()
    billService: string;

    @IsPositive()
    @IsNumber()
    amount: number;

    @IsOptional()
    @IsPositive()
    @IsNumber()
    serviceCharge: number;

    @IsEnum(MeterType)
    meterType: MeterType;

    @IsString()
    discoType: string;

    @IsString()
    meterCode: string;

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

    @IsOptional()
    @IsString()
    accessToken: string;

    @IsOptional()
    @IsEnum(MeterAccountType)
    meterAccountType: MeterAccountType;

    @IsString()
    meterAccountName: string;

    @IsString()
    meterAccountAddress;
}

export class GetMeterInfoDto {
    @IsEnum(BillProviderSlugForPower)
    billProvider: BillProviderSlugForPower;

    @IsString()
    meterNumber: string;

    @IsEnum(MeterType)
    meterType: MeterType;

    @IsString()
    meterCode: string;
}
