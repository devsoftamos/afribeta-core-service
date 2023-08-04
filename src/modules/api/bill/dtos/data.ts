import { NetworkDataProvider } from "@/modules/workflow/billPayment";
import { IsEnum, IsNumber, IsString } from "class-validator";
import { PurchaseBillDto } from ".";

export class GetDataBundleDto {
    @IsEnum(NetworkDataProvider)
    billService: NetworkDataProvider;
}

export class PurchaseDataDto extends PurchaseBillDto {
    @IsString()
    vtuNumber: string;

    @IsString()
    dataCode: string;

    @IsString()
    packageType: string;

    @IsNumber()
    price: number;

    @IsEnum(NetworkDataProvider)
    billService: NetworkDataProvider;
}
