import { Module, forwardRef } from "@nestjs/common";
import { WalletModule } from "../api/wallet";
import { SchedulerService } from "./services";

@Module({
    imports: [forwardRef(() => WalletModule)],
    providers: [SchedulerService],
    exports: [SchedulerService],
})
export class SchedulerModule {}
