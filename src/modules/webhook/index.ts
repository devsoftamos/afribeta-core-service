import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { PaystackWebhookModule } from "./paystack";
import { ProvidusWebhookModule } from "./providus";

@Module({
    imports: [
        ProvidusWebhookModule,
        PaystackWebhookModule,
        RouterModule.register([
            {
                path: "webhook",
                module: PaystackWebhookModule,
            },
            {
                path: "webhook",
                module: ProvidusWebhookModule,
            },
        ]),
    ],
})
export class WebhookModule {}
