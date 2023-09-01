import { TermiiException, TermiiSms } from "@/libs/sms";
import { HttpStatus, Injectable } from "@nestjs/common";
import { SmsGenericException, TermiiSmsException } from "../errors";
import { SendOptions, SmsProvider, TermiiProvider } from "../interfaces";
import logger from "moment-logger";

@Injectable()
export class SmsService {
    constructor(private termiiSms: TermiiSms) {}

    async send<P extends SmsProvider>(options: SendOptions<P>) {
        try {
            switch (options.provider) {
                case "termii": {
                    const termiiOptions =
                        options as SendOptions<TermiiProvider>;
                    return await this.termiiSms.send({
                        ...termiiOptions,
                        sms: options.message,
                        to: options.phone,
                    });
                }

                default: {
                    throw new SmsGenericException(
                        "Invalid sms provider",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof SmsGenericException: {
                    throw new SmsGenericException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                case error instanceof TermiiException: {
                    throw new TermiiSmsException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new SmsGenericException(
                        "Error sending sms",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }
}
