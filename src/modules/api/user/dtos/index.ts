import { IsNumberString, IsString, Length } from "class-validator";

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

export class UpsertTransactionPinDto {
    @IsNumberString()
    @Length(4, 4)
    pin: string;

    @IsString()
    password: string;
}
