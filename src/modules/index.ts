import { Module } from "@nestjs/common";
import { APIModule } from "./api";
import { CoreModule } from "./core";
import { WebhookModule } from "./webhook";
import { WorkflowModule } from "./workflow";
import { ScheduleModule } from "@nestjs/schedule";
import { SchedulerModule } from "./scheduler";
@Module({
    imports: [
        APIModule,
        WebhookModule,
        CoreModule,
        WorkflowModule,
        ScheduleModule.forRoot(),
        SchedulerModule,
    ],
})
export class AppModule {}
