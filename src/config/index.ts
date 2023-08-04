import { config } from "dotenv";

import validate, {
    RequiredEnvironment,
    RequiredEnvironmentTypes,
} from "@boxpositron/vre";
import { PaystackOptions } from "@/libs/paystack";
import { IRechargeOptions } from "@/libs/iRecharge";
import { ProvidusOptions } from "@/libs/providus";

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
];

validate(runtimeEnvironment);

//app
export const allowedDomains =
    process.env.ALLOWED_DOMAINS && process.env.ALLOWED_DOMAINS.split(",");
export const isProduction: boolean = process.env.NODE_ENV === "production";
export const port: number = parseInt(process.env.PORT ?? "4000");

//email
export const brevoApiKey: string = process.env.BREVO_API_KEY;

//sms
export const termiiApiKey: string = process.env.TERMII_API_KEY;

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

export const showStack = process.env.STACK_MODE == "show_error_stack";

export const paystackConfiguration: PaystackOptions = {
    baseUrl: process.env.PAYSTACK_BASE_URL,
    secretKey: process.env.PAYSTACK_SECRET_KEY,
};

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
