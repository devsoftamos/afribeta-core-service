import { IsOptional, IsString } from "class-validator";

export class FetchRolesDto {
    @IsOptional()
    @IsString()
    roleName: string;
}
