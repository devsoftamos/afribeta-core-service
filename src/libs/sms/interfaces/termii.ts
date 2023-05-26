import { Optional } from ".";

export interface TermiiSmsRequestOptions {
    to: string;
    from: string;
    sms: string;
    type: "plain";
    api_key: string;
    channel: "generic" | "whatsapp" | "dnd";
    media?: {
        url: string;
        caption: string;
    };
}

export type TermiiSmsOptions = Omit<
    Optional<TermiiSmsRequestOptions, "from">,
    "api_key"
>;

export interface TermiiResponse {
    message_id: string;
    message: string;
    user: string;
    balance: number;
}
