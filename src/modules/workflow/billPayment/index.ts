import { Module } from "@nestjs/common";
import { IRechargeWorkflowModule } from "./providers/iRecharge";
export * from "./interfaces";

@Module({
    imports: [IRechargeWorkflowModule],
})
export class BillPaymentWorkflowModule {}
