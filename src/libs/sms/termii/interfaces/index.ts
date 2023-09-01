export type Optional<T, Key extends keyof T> = Omit<T, Key> & Partial<T>;

export interface SmsRequestOptions {
    to: string | string[];
    from: string;
    sms: string;
    type?: "plain";
    api_key: string;
    channel?: "generic" | "whatsapp" | "dnd";
    media?: {
        url: string;
        caption: string;
    };
}

export interface SmsOptions {
    baseUrl: string;
    sender?: string;
    apiKey: string;
}

export type SendOptions = Omit<Optional<SmsRequestOptions, "from">, "api_key">;

export interface SmsResponse {
    message_id: string;
    message: string;
    user: string;
    balance: number;
}
