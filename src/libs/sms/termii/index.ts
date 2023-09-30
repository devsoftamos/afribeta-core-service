import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { TermiiException } from "./errors";
import {
    SmsResponse,
    SendOptions,
    SmsOptions,
    SmsRequestOptions,
} from "./interfaces";

export * as Termii from "./interfaces";
export * from "./errors";

export class TermiiSms {
    private axios: AxiosInstance = Axios.create({
        baseURL: this.instanceOptions.baseUrl,
        headers: {
            "Content-Type": "application/json",
        },
    });
    constructor(protected instanceOptions: SmsOptions) {}

    async send(options: SendOptions): Promise<SmsResponse> {
        try {
            const from = options.from ?? this.instanceOptions.sender;
            if (!from) {
                throw new TermiiException("sms sender name is required");
            }

            const messageOptions: SmsRequestOptions = {
                api_key: this.instanceOptions.apiKey,
                channel: options.channel ?? "generic",
                from: from,
                sms: options.sms,
                to: options.to,
                type: options.type ?? "plain",
                media: options.media,
            };
            const requestOptions: AxiosRequestConfig<SmsRequestOptions> = {
                headers: {
                    "Content-Type": "application/json",
                },
                url: "/sms/send",
                method: "POST",
                data: messageOptions,
            };
            const { data } = await this.axios<SmsResponse>(requestOptions);
            return data;
        } catch (error) {
            if (!Axios.isAxiosError(error)) {
                throw error;
            }
            const err = new TermiiException("Failed to send sms");
            err.response = error.response;
            throw err;
        }
    }
}
