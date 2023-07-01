import { Module } from "@nestjs/common";
import { IRechargeWorkflowModule } from "./providers/iRecharge";

@Module({
    imports: [IRechargeWorkflowModule],
})
export class BillPaymentWorkflowModule {}
