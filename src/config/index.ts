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
import { BuyPowerOptions } from "@/libs/buyPower";
import { Termii } from "@/libs/sms";

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
        name: "AWS_ACCESS_KEY_ID",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "AWS_SECRET_ACCESS_KEY",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "AWS_REGION",
        type: RequiredEnvironmentTypes.String,
    },
    {
        name: "AWS_S3_BUCKET",
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

    // {
    //     name: "POLARIS_API_KEY",
    //     type: RequiredEnvironmentTypes.String,
    // },
    // {
    //     name: "POLARIS_CLIENT_SECRET",
    //     type: RequiredEnvironmentTypes.String,
    // },
    // {
    //     name: "POLARIS_BASE_URL",
    //     type: RequiredEnvironmentTypes.String,
    // },
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

//Error stack
export const showStack = process.env.STACK_MODE == "show_error_stack";

//manual env
export const manualEnvironment = process.env.MANUAL_ENVIRONMENT;

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
};
export const fsdh360ApiKeyAuth = process.env.FSDH360_API_KEY_AUTH;
export const fsdh360Ips = process.env.FSDH360_IPS.split(",");

//AWS
export interface AWSConfiguration {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3Bucket: string;
}

export const awsConfiguration: AWSConfiguration = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    s3Bucket: process.env.AWS_S3_BUCKET,
};

//polaris bank
export const polarisBankOptions: PolarisBankOptions = {
    apiKey: process.env.POLARIS_API_KEY,
    clientSecret: process.env.POLARIS_CLIENT_SECRET,
    baseUrl: process.env.POLARIS_BASE_URL,
};

//buypower
export const buyPowerOptions: BuyPowerOptions = {
    baseUrl: process.env.BUYPOWER_BASE_URL,
    token: process.env.BUYPOWER_TOKEN,
};

//sms
export const termiiSmsOptions: Termii.SmsOptions = {
    baseUrl: process.env.TERMII_BASE_URL,
    apiKey: process.env.TERMII_API_KEY,
    sender: process.env.TERMII_SMS_SENDER,
};

export const frontendDevOrigin = [/^http:\/\/localhost:\d+$/];
