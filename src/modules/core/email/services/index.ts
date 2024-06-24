import TransactionalEmail from "@calculusky/transactional-email";
import { HttpStatus, Injectable } from "@nestjs/common";
import { InvalidEmailProviderException } from "../errors";
import { SendOptions } from "../interfaces";

@Injectable()
export class EmailService {
    constructor(private brevo: TransactionalEmail<"sendinblue">) {}

    async send<TParams = Record<string, any>>(
        options: SendOptions<TParams>
    ): Promise<any> {
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
