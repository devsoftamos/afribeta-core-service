import { brevoApiKey, MAIL_SENDER_EMAIL, MAIL_SENDER_NAME } from "@/config";
import TransactionalEmail from "@calculusky/transactional-email";
import { Injectable } from "@nestjs/common";

@Injectable()
export class EmailService {
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
