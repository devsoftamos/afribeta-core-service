import { IsDateString, IsEnum, IsNumber } from "class-validator";
import { BillServiceSlug } from "../../user";

export class UpdateSingleBillCommissionDto {
    @IsEnum(BillServiceSlug)
    slug: BillServiceSlug;

    @IsNumber({
        maxDecimalPlaces: 2,
    })
    percentage: number;
}

export class FetchCommissionDto {
    @IsDateString()
    date: Date;
}
