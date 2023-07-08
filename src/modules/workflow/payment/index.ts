import { Module } from "@nestjs/common";
import { PaystackWorkflowModule } from "./providers/paystack";

@Module({
    imports: [PaystackWorkflowModule],
})
export class PaymentWorkflowModule {}
