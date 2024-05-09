import { AGENT_MD_METER_COMMISSION_CAP_AMOUNT } from "@/config";
import { IdentificationMeans } from "@prisma/client";
import { Type } from "class-transformer";
import {
    ArrayMinSize,
    IsArray,
    IsBase64,
    IsBooleanString,
    IsDateString,
    IsEmail,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsNumberString,
    IsOptional,
    IsPhoneNumber,
    IsPositive,
    IsString,
    Length,
    Max,
    ValidateNested,
} from "class-validator";
import { BillServiceSlug } from "../interfaces";

export class GetUserByIdentifierDto {
    @IsString()
    id: string;
}

export enum MerchantStatusType {
    APPROVED_MERCHANTS = "approvedMerchants",
    AGENT_TO_BE_UPGRADED = "agentsToBeUpgraded",
    AGENT_AWAITING_UPGRADE = "agentsAwaitingUpgrade",
}

export class UpdateProfilePasswordDto {
    @IsString()
    oldPassword: string;

    @IsString()
    newPassword: string;
}

export class UpdateTransactionPinDto {
    @IsNumberString(
        {},
        { message: "Transaction pin must be four digits numeric characters" }
    )
    @Length(4, 4, {
        message: "Transaction pin must be four digits numeric characters",
    })
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

    @IsNumber({ maxDecimalPlaces: 1 })
    percentage: number;

    @IsOptional()
    @IsInt()
    @Max(AGENT_MD_METER_COMMISSION_CAP_AMOUNT)
    subAgentMdMeterCapAmount: number;
}
export class CreateSubAgentDto {
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

export class ListAdminUsers extends ListMerchantAgentsDto {}

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

export enum AuthorizeAgentUpgradeType {
    APPROVE = "APPROVE",
    DECLINE = "DECLINE",
}

export class AgentUpgradeBillServiceCommissionOptions {
    @IsEnum(BillServiceSlug)
    billServiceSlug: BillServiceSlug;

    @IsPositive()
    @IsNumber({ maxDecimalPlaces: 2 })
    percentage: number;
}

export class AuthorizeAgentToMerchantUpgradeAgentDto {
    @IsEnum(AuthorizeAgentUpgradeType)
    authorizeType: AuthorizeAgentUpgradeType;

    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => AgentUpgradeBillServiceCommissionOptions)
    @ArrayMinSize(1)
    @IsArray()
    billServiceCommissions: AgentUpgradeBillServiceCommissionOptions[];
}
export class FetchAllMerchantsDto {
    @IsOptional()
    @IsBooleanString()
    pagination: string;

    @IsOptional()
    @IsNumberString()
    page: number;

    @IsOptional()
    @IsNumberString()
    limit: number;
}

export class CountAgentsCreatedDto {
    @IsDateString()
    date: string;
}

export class CreateUserDto {
    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    password: string;

    @IsPhoneNumber("NG")
    @Length(11, 11, {
        message: "Phone number must be valid containing 11 digits",
    })
    phone: string;

    @IsInt()
    roleId: number;
}

export class EditAgentDto {
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
}

export enum EnableOrDisableUserEnum {
    ENABLE = "ENABLE",
    DISABLE = "DISABLE",
}
export class EnableOrDisableUserDto {
    @IsEnum(EnableOrDisableUserEnum)
    actionType: EnableOrDisableUserEnum;
}
