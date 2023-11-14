import { IsArray, IsInt, IsOptional, IsString } from "class-validator";

export class FetchRolesDto {
    @IsOptional()
    @IsString()
    roleName: string;
}

export class CreateRoleDto {
    @IsString({ message: "Role name must be a string" })
    roleName: string;

    @IsArray()
    @IsInt({ each: true })
    permissions: number[];
}
