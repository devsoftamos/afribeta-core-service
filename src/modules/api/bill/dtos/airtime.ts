import { NetworkDataProvider } from "@/modules/workflow/billPayment";
import { IsEnum, IsInt, IsString } from "class-validator";
import { PurchaseBillDto } from ".";

export class PurchaseAirtimeDto extends PurchaseBillDto {
    @IsString()
    vtuNumber: string;

    @IsInt()
    vtuAmount: number;

    @IsEnum(NetworkDataProvider)
    networkProvider: NetworkDataProvider;
}
