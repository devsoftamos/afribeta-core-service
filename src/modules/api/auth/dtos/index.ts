import {
    IsEmail,
    IsEnum,
    IsOptional,
    IsPhoneNumber,
    IsString,
} from "class-validator";

enum UserType {
    AGENT = "agent",
    CUSTOMER = "customer",
}

export class SignUpDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEmail()
    email: string;

    @IsPhoneNumber("NG")
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
    phone: string;

    @IsString()
    firstName: string;
}
