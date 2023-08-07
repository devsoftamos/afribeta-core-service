import { Module } from "@nestjs/common";
import { FSDH360BankWorkflowModule } from "./providers/fsdh360Bank";
import { PaystackWorkflowModule } from "./providers/paystack";
import { ProvidusWorkflowModule } from "./providers/providus";
import { SquadGTBankWorkflowModule } from "./providers/squadGTBank";

@Module({
    imports: [
        PaystackWorkflowModule,
        ProvidusWorkflowModule,
        FSDH360BankWorkflowModule,
        SquadGTBankWorkflowModule,
    ],
})
export class PaymentWorkflowModule {}
