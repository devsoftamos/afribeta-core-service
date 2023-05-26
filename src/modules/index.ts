import { Module } from "@nestjs/common";
import { WebhookModule } from "./webhook";
import { APIModule } from "./api";
import { CoreModule } from "./core";
@Module({
    imports: [APIModule, CoreModule, WebhookModule],
})
export class AppModule {}
