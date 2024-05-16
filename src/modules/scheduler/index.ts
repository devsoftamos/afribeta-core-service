import { Module, forwardRef } from "@nestjs/common";
import { WalletModule } from "../api/wallet";
import { WalletSchedulerService } from "./services/wallet";

@Module({
    imports: [forwardRef(() => WalletModule)],
    providers: [WalletSchedulerService],
    exports: [WalletSchedulerService],
})
export class SchedulerModule {}
