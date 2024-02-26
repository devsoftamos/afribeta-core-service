import { Module } from "@nestjs/common";
import { BuyPowerWorkflowModule } from "./providers/buyPower";
import { IRechargeWorkflowModule } from "./providers/iRecharge";
import { IkejaElectricWorkflowModule } from "./providers/ikejaElectric";
export * from "./interfaces";
export * from "./errors";

@Module({
    imports: [
        IRechargeWorkflowModule,
        BuyPowerWorkflowModule,
        IkejaElectricWorkflowModule,
    ],
})
export class BillPaymentWorkflowModule {}
