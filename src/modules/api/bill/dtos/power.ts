import {
    IsEnum,
    IsInt,
    IsOptional,
    IsPhoneNumber,
    IsString,
    Length,
} from "class-validator";
import { PurchaseBillDto } from ".";
import { BillProviderSlugForPower, MeterType } from "../interfaces";

export class PurchasePowerDto extends PurchaseBillDto {
    @IsInt()
    amount: number;

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
