import { Module } from "@nestjs/common";
import { APIModule } from "./api";
import { CoreModule } from "./core";
import { WebhookModule } from "./webhook";
import { WorkflowModule } from "./workflow";
@Module({
    imports: [APIModule, WebhookModule, CoreModule, WorkflowModule],
})
export class AppModule {}
