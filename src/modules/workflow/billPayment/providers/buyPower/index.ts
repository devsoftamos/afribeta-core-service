import { Global, Module } from "@nestjs/common";
import { BuyPowerWorkflowService } from "./services";
import { buyPowerOptions } from "@/config";
import { BuyPower } from "@/libs/buyPower";
export * from "./errors";

@Global()
@Module({
    providers: [
        {
            provide: BuyPowerWorkflowService,
            useFactory() {
                const buyPower = new BuyPower({
                    baseUrl: buyPowerOptions.baseUrl,
                    token: buyPowerOptions.token,
                });
                return new BuyPowerWorkflowService(buyPower);
            },
        },
    ],
    exports: [BuyPowerWorkflowService],
})
export class BuyPowerWorkflowModule {}
