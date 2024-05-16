import { Module } from "@nestjs/common";
import { APIModule } from "./api";
import { CoreModule } from "./core";
import { WebhookModule } from "./webhook";
import { WorkflowModule } from "./workflow";
import { ScheduleModule } from "@nestjs/schedule";
import { SchedulerModule } from "./scheduler";
import { BullModule } from "@nestjs/bull";

@Module({
    imports: [
        APIModule,
        WebhookModule,
        CoreModule,
        WorkflowModule,
        BullModule.forRoot({
            url: "redisUrl",
        }),

        ScheduleModule.forRoot(),
        SchedulerModule,
    ],
})
export class AppModule {}
