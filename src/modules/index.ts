import { Module } from "@nestjs/common";
import { APIModule } from "./api";
import { CoreModule } from "./core";
import { WebhookModule } from "./webhook";
import { WorkflowModule } from "./workflow";
import { ScheduleModule } from "@nestjs/schedule";
import { SchedulerModule } from "./scheduler";
import { BullModule } from "@nestjs/bull";
import { isProdEnvironment, redisConfiguration } from "@/config";
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
            redis: {
                host: redisConfiguration.host,
                port: redisConfiguration.port,
                username: redisConfiguration.user,
                password: redisConfiguration.password,
                tls: isProdEnvironment ? {} : undefined, //current prod uses tls
            },
        }),

        ScheduleModule.forRoot(),
        SchedulerModule,
    ],
})
export class AppModule {}
