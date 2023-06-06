import { Module } from "@nestjs/common";
import { PaymentWorkflowModule } from "./payment";

@Module({
    imports: [PaymentWorkflowModule],
})
export class WorkflowModule {}
