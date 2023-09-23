import { BullModuleOptions } from "@nestjs/bull";
import { BillQueue } from "./interfaces";
export * from "./interfaces";

export const buypowerReQueryOptions: BullModuleOptions = {
    name: BillQueue.BUYPOWER_REQUERY,
    defaultJobOptions: {
        attempts: 3,
        delay: 60 * 10 * 1000,
        removeOnFail: true,
        removeOnComplete: true,
    },
};

export const billQueueConfig: BullModuleOptions[] = [buypowerReQueryOptions];
