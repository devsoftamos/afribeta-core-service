import { NetworkAirtimeProvider } from "@/modules/workflow/billPayment";
import { IsEnum, IsNumber, IsPositive, IsString } from "class-validator";
import { PurchaseBillDto } from ".";

export class PurchaseAirtimeDto extends PurchaseBillDto {
    @IsString()
    vtuNumber: string;

    @IsPositive()
    @IsNumber()
    vtuAmount: number;

    @IsEnum(NetworkAirtimeProvider)
    billService: NetworkAirtimeProvider;
}
