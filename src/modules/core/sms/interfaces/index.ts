import { Termii } from "@/libs/sms";

export type TermiiProvider = "termii";
export type SmsProvider = TermiiProvider;

export type SendOptions<P extends SmsProvider, K = SmsProviderMap[P]> = {
    message: string;
    phone: string | string[];
    provider: P;
} & K;

export type TermiiProviderSendOptions = Omit<Termii.SendOptions, "to" | "sms">;

export interface SmsProviderMap {
    termii: TermiiProviderSendOptions;
    //other providers
}
