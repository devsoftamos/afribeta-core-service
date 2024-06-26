import {
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
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
    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsOptional()
    @IsNotEmpty()
    @IsString()
    middleName: string;

    @IsOptional()
    @IsString()
    businessName: string;

    @IsEmail({}, { message: "Invalid email address" })
    email: string;

    @IsPhoneNumber("NG")
    @Length(11, 11, { message: "Phone number must be 11 digits" })
    phone: string;

    @IsOptional()
    @IsInt()
    localGovernmentAreaId: number;

    @IsOptional()
    @IsInt()
    stateId: number;

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsEnum(UserType)
    userType: UserType;

    @IsString()
    verificationCode: string;
}

export class SignInDto {
    @IsEmail({}, { message: "Invalid email address" })
    email: string;

    @IsString({ message: "Invalid password format" })
    password: string;
}

export enum UserSignInAppType {
    AGENCY = "AGENCY",
    CUSTOMER = "CUSTOMER",
}
export class UserSigInDto extends SignInDto {
    @IsEnum(UserSignInAppType)
    appType: UserSignInAppType;
}

export class SendVerificationCodeDto {
    @IsEmail({}, { message: "Invalid email address" })
    email: string;

    @IsPhoneNumber("NG")
    @Length(11, 11, { message: "Phone number must be 11 digits" })
    phone: string;

    @IsNotEmpty()
    @IsString()
    firstName: string;
}

export class PasswordResetRequestDto {
    @IsEmail({}, { message: "Invalid email address" })
    email: string;
}

export class UpdatePasswordDto {
    @IsString()
    newPassword: string;

    @IsString()
    resetCode: string;
}

export class SubAgentAccountCreateVerificationDto {
    @IsString()
    verificationCode: string;
}
