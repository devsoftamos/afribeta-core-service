import { IsString } from "class-validator";

export class FetchRolesDto {
    @IsString()
    role: string;
}
