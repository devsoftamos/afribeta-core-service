import { mailConfig } from "@/config";
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
                    apiKey: mailConfig.apiKey,
                    provider: "sendinblue",
                    from: {
                        email: mailConfig.senderEmail,
                        name: mailConfig.senderName,
                    },
                });
                return new EmailService(brevo);
            },
        },
    ],
    exports: [EmailService],
})
export class EmailModule {}
