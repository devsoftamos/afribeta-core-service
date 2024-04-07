import { NetworkDataProvider } from "@/modules/workflow/billPayment";
import { IsEnum, IsNumber, IsPositive, IsString } from "class-validator";
import { PurchaseBillDto } from ".";
import { BillProviderSlug } from "../interfaces";

export class GetDataBundleDto {
    @IsEnum(NetworkDataProvider)
    billService: NetworkDataProvider;

    @IsEnum(BillProviderSlug)
    billProvider: BillProviderSlug;
}

export class PurchaseDataDto extends PurchaseBillDto {
    @IsString()
    vtuNumber: string;

    @IsString()
    dataCode: string;

    @IsString()
    packageType: string;

    @IsPositive()
    @IsNumber()
    price: number;

    @IsEnum(NetworkDataProvider)
    billService: NetworkDataProvider;
}
