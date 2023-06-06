import { Module } from "@nestjs/common";
import { ProvidusBankWebhookService } from "./services";

@Module({
    providers: [ProvidusBankWebhookService],
})
export class ProvidusBankWebhookModule {}
