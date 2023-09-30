export enum Template {
    VERIFY_EMAIL = "VERIFY_EMAIL",
    SUBAGENT_VERIFY_EMAIL = "SUBAGENT_VERIFY_EMAIL",
    PREPAID_METER_VEND = "PREPAID_METER_VEND",
}

export interface MessageOptions<T extends Template = Template> {
    template: T;
    data?: T extends keyof SMSTemplateDataMap ? SMSTemplateDataMap[T] : never;
}

export type SMSTemplateDataMap = {
    [Template.VERIFY_EMAIL]: VerifyEmailData;
    [Template.SUBAGENT_VERIFY_EMAIL]: SubAgentVerifyEmailData;
    [Template.PREPAID_METER_VEND]: PrepaidMeterVendData;
};

export interface VerifyEmailData {
    email: string;
}

export interface SubAgentVerifyEmailData {
    email: string;
    merchantFirstName: string;
    merchantLastName: string;
}

export interface PrepaidMeterVendData {
    token: string;
    units: string;
}

export type SmsTemplateMessage = <T extends Template = Template>(
    options: MessageOptions<T>
) => string;
