import { CableTVProvider } from "@/modules/workflow/billPayment";
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
} from "class-validator";
import { PurchaseBillDto } from ".";
import { BillProviderSlug } from "../interfaces";

export class GetTVBouquetDto {
    @IsEnum(CableTVProvider)
    billService: CableTVProvider;

    @IsEnum(BillProviderSlug)
    billProvider: BillProviderSlug;
}

export class PurchaseTVDto extends PurchaseBillDto {
    @IsString()
    phone: string;

    @IsOptional()
    @IsPositive()
    @IsNumber()
    serviceCharge: number;

    @IsString()
    smartCardNumber: string;

    @IsString()
    tvCode: string;

    @IsOptional()
    @IsString()
    accessToken: string;

    @IsString()
    packageType: string;

    @IsPositive()
    @IsNumber()
    price: number;

    @IsOptional()
    @IsString()
    narration: string;

    @IsEnum(CableTVProvider)
    billService: CableTVProvider;
}

export class GetSmartCardInfoDto {
    @IsEnum(BillProviderSlug)
    billProvider: BillProviderSlug;

    @IsString()
    tvCode: string;

    @IsString()
    smartCardNumber: string;

    @IsEnum(CableTVProvider)
    billService: CableTVProvider;
}
