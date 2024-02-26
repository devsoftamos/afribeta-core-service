import { IsArray, IsInt, IsOptional, IsString } from "class-validator";

export class FetchRolesDto {
    @IsOptional()
    @IsString()
    searchName: string;
}

export class CreateRoleDto {
    @IsString({ message: "Role name must be a string" })
    roleName: string;

    @IsArray()
    @IsInt({ each: true })
    permissions: number[];
}

export class UpdateRoleDto {
    @IsString({ message: "Role name must be a string" })
    roleName: string;
}
