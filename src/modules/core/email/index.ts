import { brevoApiKey, MAIL_SENDER_EMAIL, MAIL_SENDER_NAME } from "@/config";
import TransactionalEmail from "@calculusky/transactional-email";
import { Global, Module } from "@nestjs/common";
import { EmailService } from "./services";

@Global()
@Module({
    providers: [
        {
            provide: EmailService,
            useFactory() {
                const brevo = new TransactionalEmail({
                    apiKey: brevoApiKey,
                    provider: "sendinblue",
                    from: { email: MAIL_SENDER_EMAIL, name: MAIL_SENDER_NAME },
                });
                return new EmailService(brevo);
            },
        },
    ],
    exports: [EmailService],
})
export class EmailModule {}
