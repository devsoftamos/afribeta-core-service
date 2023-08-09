import {
    EbulkResponse,
    SendSmsOptions,
    SmsOptions,
    SmsProviders,
    TermiiProvider,
    TermiiResponse,
    TermiiSmsOptions,
    TermiiSmsRequestOptions,
} from "./interfaces";
import { SmsFieldValidationException, TermiiException } from "./errors";
import Axios, { AxiosRequestConfig } from "axios";
import { termiiEndpoint } from "./interfaces/constants";

export * from "./interfaces";
export * from "./errors";

export class Sms<Provider extends SmsProviders> {
    constructor(protected smsOptions: SmsOptions<Provider>) {}

    async send<
        T extends Provider,
        R = T extends TermiiProvider ? TermiiResponse : EbulkResponse
    >(options: SendSmsOptions<T>): Promise<R> {
        switch (this.smsOptions.provider) {
            case "termii": {
                return (await this.handleTermii(options)) as unknown as R;
            }

            default: {
                return (await this.handleTermii(options)) as unknown as R;
            }
        }
    }

    private async handleTermii(
        options: TermiiSmsOptions
    ): Promise<TermiiResponse> {
        try {
            const from = options.from ?? this.smsOptions.from;
            if (!from) {
                throw new SmsFieldValidationException(
                    'sms field, "from" is required'
                );
            }

            const messageOptions: TermiiSmsRequestOptions = {
                api_key: this.smsOptions.apiKey,
                channel: options.channel,
                from: from,
                sms: options.sms,
                to: options.to,
                type: options.type,
                media: options.media,
            };
            const requestOptions: AxiosRequestConfig<TermiiSmsOptions> = {
                headers: {
                    "Content-Type": "application/json",
                },
                url: termiiEndpoint,
                method: "POST",
                data: messageOptions,
            };
            const { data } = await Axios<TermiiResponse>(requestOptions);
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

    // private async handlerEbulk() {
    //     return { messageId: "" };
    // }
}
