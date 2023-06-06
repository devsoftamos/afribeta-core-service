import { IsNotEmpty, IsNumberString, IsString, Length } from "class-validator";

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
    transactionPin: string;

    @IsString()
    password: string;
}

export class VerifyTransactionPinDto {
    @IsNumberString({}, { message: "Invalid pin format" })
    @IsNotEmpty({ message: "Pin must not be empty" })
    transactionPin: string;
}
