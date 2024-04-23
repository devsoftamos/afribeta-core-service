import { Module, forwardRef } from "@nestjs/common";
import { WalletModule } from "../api/wallet";
import { WalletSchedulerService } from "./services/wallet";
// import { BillSchedulerService } from "./services/bill";
import { BullModule } from "@nestjs/bull";
import { billBoardQueueConfig, scheduleQueueConfig } from "./queues";
// import { IkejaElectricQueueProcessor } from "./queues/processors";
import { BullBoardModule } from "@bull-board/nestjs";

@Module({
    imports: [
        forwardRef(() => WalletModule),
        BullModule.registerQueue(...scheduleQueueConfig),
        BullBoardModule.forFeature(...billBoardQueueConfig),
    ],
    providers: [
        WalletSchedulerService,
        // BillSchedulerService, -------------------moved to api service----------------
        // IkejaElectricQueueProcessor,
    ],
    exports: [WalletSchedulerService],
})
export class SchedulerModule {}
