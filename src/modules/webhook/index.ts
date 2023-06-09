import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { PaystackWebhookModule } from "./paystack";
import { ProvidusBankWebhookModule } from "./providusBank";

@Module({
    imports: [
        ProvidusBankWebhookModule,
        PaystackWebhookModule,
        RouterModule.register([
            {
                path: "webhook",
                module: PaystackWebhookModule,
            },
        ]),
    ],
})
export class WebhookModule {}
