import { config } from "dotenv";

import validate, {
    RequiredEnvironment,
    RequiredEnvironmentTypes,
} from "@boxpositron/vre";
import { PaystackOptions } from "@/libs/paystack";
import { IRechargeOptions } from "@/libs/iRecharge";
import { ProvidusOptions } from "@/libs/providus";
import { SquadGTBankOptions } from "@/libs/squadGTBank/interfaces";
import { FSDH360BankOptions } from "@/libs/fsdh360Bank/interfaces";
import { PolarisBankOptions } from "@/libs/polarisBank/interfaces";
import { Termii } from "@/libs/sms";
import { IBuyPower } from "@/libs/buyPower";
import { IkejaElectricOptions } from "@calculusky/ikeja-electric-sdk";

export * from "./constants";

config();

const runtimeEnvironment: RequiredEnvironment[] = [
    {
        name: "PORT",
        type: RequiredEnvironmentTypes.Number,
    },
    {
        name: "ALLOWED_DOMAINS",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "BREVO_API_KEY",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "JWT_SECRET",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "TERMII_API_KEY",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "VERIFY_EMAIL_TEMPLATE",
        type: RequiredEnvironmentTypes.Number,
    },
    {
        name: "PASSWORD_RESET_TEMPLATE",
        type: RequiredEnvironmentTypes.Number,
    },
    {
        name: "PAYSTACK_SECRET_KEY",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "PAYSTACK_BASE_URL",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "IRECHARGE_PUBLIC_KEY",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "IRECHARGE_PRIVATE_KEY",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "IRECHARGE_VENDOR_CODE",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "IRECHARGE_BASE_URL",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "PAYSTACK_VIRTUAL_ACCOUNT_BANK",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "PAYSTACK_VIRTUAL_ACCOUNT_BANK",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "PAYSTACK_VIRTUAL_ACCOUNT_BANK",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "PAYSTACK_VIRTUAL_ACCOUNT_BANK",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "AGENT_POST_ACCOUNT_CREATE_TEMPLATE",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "AGENT_VERIFY_EMAIL_TEMPLATE",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "SQUAD_GTBANK_BASE_URL",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "SQUAD_GTBANK_PRIVATE_KEY",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "SQUAD_GTBANK_BENEFICIARY_ACCOUNT_NUMBER",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "FSDH360_BASE_URL",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "FSDH360_CLIENT_ID",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "FSDH360_CLIENT_SECRET",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "FSDH360_TOKEN_URL",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "FSDH360_MERCHANT_ACCOUNT_NUMBER",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "FSDH360_API_KEY_AUTH",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "FSDH360_IPS",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "BUYPOWER_BASE_URL",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "BUYPOWER_TOKEN",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "TERMII_BASE_URL",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "TERMII_SMS_SENDER",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "ENCRYPT_SECRET",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "REDIS_HOST",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "REDIS_PORT",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "REDIS_USER",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "REDIS_PASSWORD",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "KYC_UPLOAD_DIR",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "OCEAN_SPACE_ACCESS_KEY",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "OCEAN_SPACE_SECRET_KEY",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "OCEAN_SPACE_REGION",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "OCEAN_SPACE_BUCKET_NAME",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "OCEAN_SPACE_UPLOAD_ENDPOINT",
        type: RequiredEnvironmentTypes.String,
    },
    //ikeja electric
    {
        name: "IKEJA_ELECTRIC_APPID",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "IKEJA_ELECTRIC_CIS_PASSWORD",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "IKEJA_ELECTRIC_SFTP_PASSWORD",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "IKEJA_ELECTRIC_SFTP_USERNAME",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "IKEJA_ELECTRIC_CIS_HOST",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "IKEJA_ELECTRIC_CIS_PORT",
        type: RequiredEnvironmentTypes.Number,
    },
    {
        name: "IKEJA_ELECTRIC_SFTP_HOST",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "IKEJA_ELECTRIC_SFTP_PORT",
        type: RequiredEnvironmentTypes.Number,
    },
    {
        name: "ENVIRONMENT",
        type: RequiredEnvironmentTypes.String,
    },
];

validate(runtimeEnvironment);

//app
export const allowedDomains =
    process.env.ALLOWED_DOMAINS && process.env.ALLOWED_DOMAINS.split(",");
export const isProduction: boolean = process.env.NODE_ENV === "production";
export const port: number = parseInt(process.env.PORT ?? "4000");

//email
export const brevoApiKey: string = process.env.BREVO_API_KEY;

//jwt
export const jwtSecret: string = process.env.JWT_SECRET;

//encrypt
export const encryptSecret: string = process.env.ENCRYPT_SECRET;

//email templates
export const verifyEmailTemplate: number = +process.env.VERIFY_EMAIL_TEMPLATE;
export const passwordResetTemplate = +process.env.PASSWORD_RESET_TEMPLATE;
export const agentVerifyEmailTemplate: number =
    +process.env.AGENT_VERIFY_EMAIL_TEMPLATE;
export const agentPostAccountCreateTemplate: number =
    +process.env.AGENT_POST_ACCOUNT_CREATE_TEMPLATE;

//payment
export const paystackSecretKey: string = process.env.PAYSTACK_SECRET_KEY;

export const paystackVirtualAccountBank: string =
    process.env.PAYSTACK_VIRTUAL_ACCOUNT_BANK;

export const paystackConfiguration: PaystackOptions = {
    baseUrl: process.env.PAYSTACK_BASE_URL,
    secretKey: process.env.PAYSTACK_SECRET_KEY,
};

//env
export const isDevEnvironment = process.env.ENVIRONMENT == "development";

//IRecharge
export const iRechargeOptions: IRechargeOptions = {
    privateKey: process.env.IRECHARGE_PRIVATE_KEY,
    publicKey: process.env.IRECHARGE_PUBLIC_KEY,
    vendorCode: process.env.IRECHARGE_VENDOR_CODE,
    baseUrl: process.env.IRECHARGE_BASE_URL,
};

//providus
export const providusConfiguration: ProvidusOptions = {
    authSignature: process.env.PROVIDUS_AUTH_SIGNATURE,
    baseUrl: process.env.BASE_URL,
    clientId: process.env.CLIENT_ID,
};

//GtBank
export const squadGtBankOptions: SquadGTBankOptions = {
    secretKey: process.env.SQUAD_GTBANK_PRIVATE_KEY,
    baseUrl: process.env.SQUAD_GTBANK_BASE_URL,
    beneficiaryAccountNumber:
        process.env.SQUAD_GTBANK_BENEFICIARY_ACCOUNT_NUMBER,
};

//FSDH360
export const fsdh360BankOptions: FSDH360BankOptions = {
    baseUrl: process.env.FSDH360_BASE_URL,
    tokenUrl: process.env.FSDH360_TOKEN_URL,
    clientId: process.env.FSDH360_CLIENT_ID,
    clientSecret: process.env.FSDH360_CLIENT_SECRET,
    merchantAccountNumber: process.env.FSDH360_MERCHANT_ACCOUNT_NUMBER,
    identityUrl: process.env.FSDH360_IDENTITY_BASE_URL,
};

export const fsdh360ApiKeyAuth = process.env.FSDH360_API_KEY_AUTH;
export const fsdh360Ips = process.env.FSDH360_IPS.split(",");

//polaris bank
export const polarisBankOptions: PolarisBankOptions = {
    apiKey: process.env.POLARIS_API_KEY,
    clientSecret: process.env.POLARIS_CLIENT_SECRET,
    baseUrl: process.env.POLARIS_BASE_URL,
};

//buypower
export const buyPowerOptions: IBuyPower.BuyPowerOptions = {
    baseUrl: process.env.BUYPOWER_BASE_URL,
    token: process.env.BUYPOWER_TOKEN,
};

//sms
export const termiiSmsOptions: Termii.SmsOptions = {
    baseUrl: process.env.TERMII_BASE_URL,
    apiKey: process.env.TERMII_API_KEY,
    sender: process.env.TERMII_SMS_SENDER,
};

//redis
export interface RedisConfig {
    user: string;
    password: string;
    host: string;
    port: number;
}

export const redisConfiguration: RedisConfig = {
    host: process.env.REDIS_HOST,
    port: +process.env.REDIS_PORT,
    user: process.env.REDIS_USER ?? "",
    password: process.env.REDIS_PASSWORD ?? "",
};
export const redisUrl = `redis://${redisConfiguration.user}:${redisConfiguration.password}@${redisConfiguration.host}:${redisConfiguration.port}`;

export const frontendDevOrigin = [/^http:\/\/localhost:\d+$/];

//payout charge
export const PAYOUT_PERCENT_CHARGE = process.env.PAYOUT_PERCENT_CHARGE
    ? parseFloat(process.env.PAYOUT_PERCENT_CHARGE)
    : 2.5;

//commission config
export const AGENT_MD_METER_COMMISSION_CAP_AMOUNT = process.env
    .AGENT_MD_METER_COMMISSION_CAP_AMOUNT
    ? parseInt(process.env.AGENT_MD_METER_COMMISSION_CAP_AMOUNT)
    : 1000;
export const AGENT_MD_METER_COMMISSION_PERCENT = process.env
    .AGENT_MD_METER_COMMISSION_PERCENT
    ? parseFloat(process.env.AGENT_MD_METER_COMMISSION_PERCENT)
    : 0.25;
export const SUBAGENT_MD_METER_COMMISSION_PERCENT = process.env
    .SUBAGENT_MD_METER_COMMISSION_PERCENT
    ? parseFloat(process.env.SUBAGENT_MD_METER_COMMISSION_PERCENT)
    : 0.125;
export const DEFAULT_CAPPING_MULTIPLIER = process.env.DEFAULT_CAPPING_MULTIPLIER
    ? parseInt(process.env.DEFAULT_CAPPING_MULTIPLIER)
    : 1000;

interface StorageDirConfig {
    kycInfo: string;
}

export const storageDirConfig: StorageDirConfig = {
    kycInfo: process.env.KYC_UPLOAD_DIR,
};

//ikeja electric
export const ieConfig: IkejaElectricOptions = {
    appId: process.env.IKEJA_ELECTRIC_APPID,
    cisPassword: process.env.IKEJA_ELECTRIC_CIS_PASSWORD,
    sftpPassword: process.env.IKEJA_ELECTRIC_SFTP_PASSWORD,
    sftpUsername: process.env.IKEJA_ELECTRIC_SFTP_USERNAME,
    cisHost: process.env.IKEJA_ELECTRIC_CIS_HOST,
    cisPort: +process.env.IKEJA_ELECTRIC_CIS_PORT,
    sftpHost: process.env.IKEJA_ELECTRIC_SFTP_HOST,
    sftpPort: +process.env.IKEJA_ELECTRIC_SFTP_PORT,
    settings: {
        mode: isDevEnvironment ? "development" : "production",
    },
};

//Digital Ocean
export interface OceanSpaceConfiguration {
    accessKey: string;
    secretKey: string;
    region: string;
    bucketName: string;
    endpoint: string;
}

export const oceanSpaceConfiguration: OceanSpaceConfiguration = {
    accessKey: process.env.OCEAN_SPACE_ACCESS_KEY,
    secretKey: process.env.OCEAN_SPACE_SECRET_KEY,
    region: process.env.OCEAN_SPACE_REGION,
    bucketName: process.env.OCEAN_SPACE_BUCKET_NAME,
    endpoint: process.env.OCEAN_SPACE_UPLOAD_ENDPOINT,
};
