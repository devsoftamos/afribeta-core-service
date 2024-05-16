import { Module, forwardRef } from "@nestjs/common";
import { WalletModule } from "../api/wallet";
import { WalletSchedulerService } from "./services/wallet";
import { BullModule } from "@nestjs/bull";
import { billBoardQueueConfig, scheduleQueueConfig } from "./queues";
import { BullBoardModule } from "@bull-board/nestjs";

@Module({
    imports: [
        forwardRef(() => WalletModule),
        BullModule.registerQueue(...scheduleQueueConfig),
        BullBoardModule.forFeature(...billBoardQueueConfig),
    ],
    providers: [WalletSchedulerService],
    exports: [WalletSchedulerService],
})
export class SchedulerModule {}
