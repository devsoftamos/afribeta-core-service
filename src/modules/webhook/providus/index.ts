import { Module } from "@nestjs/common";
import { ProvidusWebhookService } from "./services";

@Module({
    providers: [ProvidusWebhookService],
})
export class ProvidusWebhookModule {}
