import { Module } from "@nestjs/common";
import { BillPaymentWorkflowModule } from "./billPayment";
import { PaymentWorkflowModule } from "./payment";

@Module({
    imports: [PaymentWorkflowModule, BillPaymentWorkflowModule],
})
export class WorkflowModule {}
