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

export class UpdateTransactionPinDto {
    @IsNumberString()
    @Length(4, 4)
    transactionPin: string;

    @IsString()
    password: string;
}

export class VerifyTransactionPinDto {
    @IsNumberString({}, { message: "Invalid pin" })
    @IsNotEmpty({ message: "Pin must not be empty" })
    transactionPin: string;
}

export class CreateTransactionPinDto {
    @IsNumberString()
    @Length(4, 4)
    transactionPin: string;
}
