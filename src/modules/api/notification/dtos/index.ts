import { IsBooleanString, IsNumberString, IsOptional } from "class-validator";

export class ListNotificationDto {
    @IsOptional()
    @IsBooleanString()
    pagination: string;

    @IsOptional()
    @IsNumberString()
    page: number;

    @IsOptional()
    @IsNumberString()
    limit: number;
}
