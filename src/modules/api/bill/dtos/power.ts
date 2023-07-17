import {
    IsEnum,
    IsInt,
    IsOptional,
    IsPhoneNumber,
    IsString,
    Length,
} from "class-validator";
import { PurchaseBillDto } from ".";

export enum MeterType {
    PREPAID = "PREPAID",
    POSTPAID = "POSTPAID",
}

export class PurchasePowerDto extends PurchaseBillDto {
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

export class GetMeterInfoDto {
    @IsString()
    billProvider: string;
}

export class WalletPowerPaymentDto {
    @IsString()
    reference: string;
}

export class GetPowerPurchaseStatusDto {
    @IsString()
    reference: string;
}