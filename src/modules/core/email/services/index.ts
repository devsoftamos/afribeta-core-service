import { brevoApiKey, MAIL_SENDER_EMAIL, MAIL_SENDER_NAME } from "@/config";
import TransactionalEmail from "@calculusky/transactional-email";
import { HttpStatus, Injectable } from "@nestjs/common";
import { InvalidEmailProviderException } from "../errors";
import { SendOptions } from "../interfaces";

@Injectable()
export class EmailServicer {
    brevo: TransactionalEmail<"sendinblue">;
    constructor() {
        this.brevo = this.initBrevo();
    }

    private initBrevo() {
        return new TransactionalEmail({
            apiKey: brevoApiKey,
            provider: "sendinblue",
            from: { email: MAIL_SENDER_EMAIL, name: MAIL_SENDER_NAME },
        });
    }
}

@Injectable()
export class EmailService {
    constructor(private brevo: TransactionalEmail<"sendinblue">) {}

    async send<TParams = Record<string, any>>(options: SendOptions<TParams>) {
        switch (options.provider) {
            case "sendinblue": {
                return await this.handleSendinblue(options);
            }

            default: {
                throw new InvalidEmailProviderException(
                    "Invalid Email Service Provider",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        }
    }

    private async handleSendinblue(options: SendOptions) {
        if (!Array.isArray(options.to)) {
            options.to = [options.to];
        }
        return await this.brevo.send({
            to: options.to,
            subject: options.subject,
            templateId: +options.templateId,
            params: options.params,
            htmlContent: options.htmlContent,
            textContent: options.textContent,
        });
    }
}
