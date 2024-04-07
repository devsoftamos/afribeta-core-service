import { NetworkInternetProvider } from "@/modules/workflow/billPayment";
import { IsEnum, IsNumber, IsPositive, IsString } from "class-validator";
import { PurchaseBillDto } from ".";
import { BillProviderSlug } from "../interfaces";

export class GetInternetBundleDto {
    @IsEnum(NetworkInternetProvider)
    billService: NetworkInternetProvider;

    @IsEnum(BillProviderSlug)
    billProvider: BillProviderSlug;
}

export class PurchaseInternetDto extends PurchaseBillDto {
    @IsString()
    vtuNumber: string;

    @IsString()
    internetCode: string;

    @IsString()
    packageType: string;

    @IsPositive()
    @IsNumber()
    price: number;

    @IsEnum(NetworkInternetProvider)
    billService: NetworkInternetProvider;
}

export class GetSmileDeviceInfoDto {
    @IsEnum(BillProviderSlug)
    billProvider: BillProviderSlug;

    @IsString()
    deviceId: string;
}
