import { Module } from "@nestjs/common";
import { APIModule } from "./api";
import { CoreModule } from "./core";
import { WebhookModule } from "./webhook";
import { WorkflowModule } from "./workflow";
import { ScheduleModule } from "@nestjs/schedule";
import { SchedulerModule } from "./scheduler";
import { BullModule } from "@nestjs/bull";
import { redisUrl } from "@/config";
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";

@Module({
    imports: [
        APIModule,
        WebhookModule,
        CoreModule,
        WorkflowModule,
        BullBoardModule.forRoot({
            route: "/queues",
            adapter: ExpressAdapter,
        }),
        BullModule.forRoot({
            url: redisUrl,
        }),

        ScheduleModule.forRoot(),
        SchedulerModule,
    ],
})
export class AppModule {}
