import { Module } from "@nestjs/common";
import { RouterModule } from "@nestjs/core";
import { PaystackWebhookModule } from "./paystack";

@Module({
    imports: [
        PaystackWebhookModule,
        RouterModule.register([
            { path: "webhooks", module: PaystackWebhookModule },
        ]),
    ],
})
export class WebhookModule {}
