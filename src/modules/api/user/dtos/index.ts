import { IdentificationMeans } from "@prisma/client";
import { Type } from "class-transformer";
import {
    ArrayMinSize,
    IsArray,
    IsBase64,
    IsBooleanString,
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsNumberString,
    IsOptional,
    IsPhoneNumber,
    IsString,
    Length,
    ValidateNested,
} from "class-validator";

enum MerchantUpgradeStatus {
    PENDING = 'PENDING',
    TO_BE_UPGRADED = 'TO_BE_UPGRADED',
    UPGRADED = 'UPGRADED',
    DECLINED = 'DECLINED'
  }

export class GetUserByIdentifierDto {
    @IsString()
    id: string;
}

export enum MerchantStatusType {
    APPROVED_MERCHANTS = "approvedMerchants",
    MERCHANT_TO_BE_UPGRADED = "merchantsToBeUpgraded",
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

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    firstName: string;

    @IsOptional()
    @IsString()
    lastName: string;

    @IsOptional()
    @IsPhoneNumber("NG")
    @Length(11, 11, {
        message: "Phone number must be valid containing 11 digits",
    })
    phone: string;

    @IsOptional()
    @IsNotEmpty()
    @IsBase64({
        message: "Photo must be a valid base64 plain text",
    })
    photo: string;
}

export class BillServiceCommissionOptions {
    @IsString()
    billServiceSlug: string;

    @IsNumber()
    percentage: number;
}
export class CreateAgentDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEmail({}, { message: "Invalid email address" })
    email: string;

    @IsPhoneNumber("NG")
    @Length(11, 11, {
        message: "Phone number must be valid containing 11 digits",
    })
    phone: string;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => BillServiceCommissionOptions)
    @ArrayMinSize(1)
    @IsArray()
    billServiceCommissions: BillServiceCommissionOptions[];

    @IsString()
    verificationCode: string;

    @IsInt()
    localGovernmentAreaId: number;

    @IsInt()
    stateId: number;
}

export class ListMerchantAgentsDto {
    @IsOptional()
    @IsBooleanString()
    pagination: string;

    @IsOptional()
    @IsNumberString()
    page: number;

    @IsOptional()
    @IsNumberString()
    limit: number;

    @IsOptional()
    @IsString()
    searchName: string;
}

export class FetchMerchantAgentsDto {

    @IsOptional()
    @IsBooleanString()
    pagination: string;

    @IsOptional()
    @IsNumberString()
    page: number;

    @IsOptional()
    @IsNumberString()
    limit: number;

    @IsOptional()
    @IsString()
    searchName: string;

    @IsEnum(MerchantStatusType)
    merchantStatus: MerchantStatusType;

}


export class CreateKycDto {
    @IsString()
    address: string;

    @IsString()
    nextOfKinName: string;

    @IsPhoneNumber("NG")
    @Length(11, 11, {
        message: "Next of Kin Phone number must be valid containing 11 digits",
    })
    nextOfKinPhone: string;

    @IsString()
    nextOfKinAddress: string;

    @IsString()
    cacNumber: string;

    @IsNotEmpty()
    @IsBase64({
        message: "CAC image file must be a valid base64 plain text",
    })
    cacImageFile: string;

    @IsEnum(IdentificationMeans)
    identificationMeans: IdentificationMeans;

    @IsNotEmpty()
    @IsBase64({
        message: "Identification image file must be a valid base64 plain text",
    })
    identificationMeansImageFile: string;
}
