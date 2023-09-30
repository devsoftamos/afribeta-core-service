import { NetworkAirtimeProvider } from "@/modules/workflow/billPayment";
import { IsEnum, IsNumber, IsString } from "class-validator";
import { PurchaseBillDto } from ".";

export class PurchaseAirtimeDto extends PurchaseBillDto {
    @IsString()
    vtuNumber: string;

    @IsNumber()
    vtuAmount: number;

    @IsEnum(NetworkAirtimeProvider)
    billService: NetworkAirtimeProvider;
}
