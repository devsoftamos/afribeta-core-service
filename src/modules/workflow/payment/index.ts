import { Module } from "@nestjs/common";
import { PaystackWorkflowModule } from "./providers/paystack";
import { ProvidusWorkflowModule } from "./providers/providus";

@Module({
    imports: [PaystackWorkflowModule, ProvidusWorkflowModule],
})
export class PaymentWorkflowModule {}
