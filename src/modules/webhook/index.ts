import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { PaystackWebhookModule } from "./paystack";

@Module({
    imports: [
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
