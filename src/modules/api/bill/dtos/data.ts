import { NetworkDataProvider } from "@/modules/workflow/billPayment";
import { IsEnum, IsInt, IsString } from "class-validator";
import { PurchaseBillDto } from ".";

export class GetDataBundleDto {
    @IsEnum(NetworkDataProvider)
    networkProvider: NetworkDataProvider;
}

export enum BillProvider {
    IRECHARGE = "irecharge",
}

export class PurchaseDataDto extends PurchaseBillDto {
    @IsString()
    vtuNumber: string;

    @IsString()
    dataCode: string;

    @IsString()
    packageType: string;

    @IsInt()
    price: number;

    @IsEnum(NetworkDataProvider)
    networkProvider: NetworkDataProvider;

    @IsEnum(BillProvider)
    billProvider: BillProvider;
}
