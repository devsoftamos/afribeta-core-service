import { IsString } from "class-validator";

export class GetUserByIdentifierDto {
    @IsString()
    id: string;
}

export class UpdateProfilePasswordDto {
    @IsString()
    oldPassword: string;

    @IsString()
    newPassword: string;
}
