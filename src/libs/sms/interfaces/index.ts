import { TermiiSmsOptions } from "./termii";
export * from "./termii";
export * from "./ebulk";

export type SmsProviders = TermiiProvider | EbulkProvider;
export type TermiiProvider = "termii";
export type EbulkProvider = "ebulk";

export type Optional<T, Key extends keyof T> = Omit<T, Key> & Partial<T>;

export interface SmsOptions<Provider extends SmsProviders = TermiiProvider> {
    provider: Provider;
    apiKey: string;
    from?: string;
}

export type SendSmsOptions<Provider extends SmsProviders> =
    Provider extends TermiiProvider ? TermiiSmsOptions : TermiiSmsOptions; //TermiiProvider in use currently
