import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsPhoneNumber,
    IsString,
    Length,
} from "class-validator";

enum UserType {
    AGENT = "AGENT",
    CUSTOMER = "CUSTOMER",
}

export class SignUpDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEmail()
    email: string;

    @IsPhoneNumber("NG")
    @Length(11, 11, { message: "Phone number must be 11 digits" })
    phone: string;

    @IsOptional()
    @IsString()
    localGovernmentArea: string;

    @IsOptional()
    @IsString()
    state: string;

    @IsString()
    password: string;

    @IsEnum(UserType)
    userType: UserType;

    @IsString()
    verificationCode: string;
}

export class SignInDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class SendVerificationCodeDto {
    @IsEmail()
    email: string;

    @IsPhoneNumber("NG")
    @Length(11, 11, { message: "Phone number must be 11 digits" })
    phone: string;

    @IsString()
    firstName: string;
}

export class PasswordResetRequestDto {
    @IsEmail()
    email: string;
}

export class UpdatePasswordDto {
    @IsString()
    newPassword: string;

    @IsString()
    resetCode: string;
}
