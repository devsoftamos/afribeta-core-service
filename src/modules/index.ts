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
        BullModule.forRoot({
            url: redisUrl,
        }),
        BullBoardModule.forRoot({
            route: "/queues",
            adapter: ExpressAdapter, // Or FastifyAdapter from `@bull-board/fastify`
        }),
        ScheduleModule.forRoot(),
        SchedulerModule,
    ],
})
export class AppModule {}
