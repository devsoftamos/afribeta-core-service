import { IsArray, IsOptional, IsString } from "class-validator";

export class FetchRolesDto {
    @IsOptional()
    @IsString()
    roleName: string;
}

export class CreateRoleDto {
    @IsString()
    roleName: string;

    @IsArray()
    permissions: Array<number>;
}
