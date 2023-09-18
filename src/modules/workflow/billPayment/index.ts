import { Module } from "@nestjs/common";
import { BuyPowerWorkflowModule } from "./providers/buyPower";
import { IRechargeWorkflowModule } from "./providers/iRecharge";
export * from "./interfaces";
export * from "./errors";

@Module({
    imports: [IRechargeWorkflowModule, BuyPowerWorkflowModule],
})
export class BillPaymentWorkflowModule {}
