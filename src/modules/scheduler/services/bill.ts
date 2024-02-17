import { InjectQueue } from "@nestjs/bull";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { IeQueue, ScheduleQueue } from "../queues";
import { Queue } from "bull";

@Injectable()
export class BillSchedulerService implements OnModuleInit {
    constructor(
        @InjectQueue(ScheduleQueue.IE_QUEUE)
        private ieQueue: Queue
    ) {}

    async onModuleInit() {
        await this.ieQueue.removeJobs("*");
        this.ieQueue.add(IeQueue.IE_RECONCILIATION);
    }
}
