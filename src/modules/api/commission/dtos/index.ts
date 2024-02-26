import {
    IsDateString,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    Max,
} from "class-validator";
import { BillServiceSlug } from "../../user";
import { AGENT_MD_METER_COMMISSION_CAP_AMOUNT } from "@/config";

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

export class UpdateSubagentCommissionDto {
    @IsEnum(BillServiceSlug)
    billServiceSlug: BillServiceSlug;

    @IsNumber({ maxDecimalPlaces: 1 })
    commission: number;

    @IsOptional()
    @IsInt()
    @Max(AGENT_MD_METER_COMMISSION_CAP_AMOUNT)
    subAgentMdMeterCapAmount: number;
}

export class DeleteSubagentCommissionDto {
    @IsEnum(BillServiceSlug)
    billServiceSlug: BillServiceSlug;
}
