import { BullModuleOptions } from "@nestjs/bull";
import { ScheduleQueue } from "./interfaces";
import { BullBoardQueueOptions } from "@bull-board/nestjs";
import { BullAdapter } from "@bull-board/api/bullAdapter";
export * from "./interfaces";

export const ikejaElectricReconciliationOptions: BullModuleOptions = {
    name: ScheduleQueue.IE_QUEUE,
    defaultJobOptions: {
        attempts: 2,
        delay: 60 * 1000,
        removeOnFail: true,
        removeOnComplete: true,
        repeat: {
            cron: "0 1 * * *", //"* * * * *",
            tz: "Africa/Lagos",
        },
    },
};

export const scheduleQueueConfig: BullModuleOptions[] = [
    ikejaElectricReconciliationOptions,
];

export const billBoardQueueConfig: BullBoardQueueOptions[] = [
    {
        name: ScheduleQueue.IE_QUEUE,
        adapter: BullAdapter,
    },
];
