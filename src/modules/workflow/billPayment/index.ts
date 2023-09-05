import { Module } from "@nestjs/common";
import { BuyPowerWorkflowModule } from "./providers/buyPower";
import { IRechargeWorkflowModule } from "./providers/iRecharge";
export * from "./interfaces";

@Module({
    imports: [IRechargeWorkflowModule, BuyPowerWorkflowModule],
})
export class BillPaymentWorkflowModule {}
