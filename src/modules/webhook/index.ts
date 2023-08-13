import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { FSDH360BankWebhookModule } from "./fsdh360Bank";
import { PaystackWebhookModule } from "./paystack";
import { ProvidusWebhookModule } from "./providus";
import { SquadGTBankWebhookModule } from "./squadGTBank";

@Module({
    imports: [
        ProvidusWebhookModule,
        PaystackWebhookModule,
        SquadGTBankWebhookModule,
        RouterModule.register([
            {
                path: "webhook",
                module: PaystackWebhookModule,
            },
            {
                path: "webhook",
                module: ProvidusWebhookModule,
            },
            {
                path: "webhook",
                module: SquadGTBankWebhookModule,
            },
            {
                path: "webhook",
                module: FSDH360BankWebhookModule,
            },
        ]),
    ],
})
export class WebhookModule {}
