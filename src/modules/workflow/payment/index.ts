import { paystackConfiguration } from "@/config";
import { Global, Module } from "@nestjs/common";
import { PaystackService } from "./services/paystack";

@Global()
@Module({
    providers: [
        {
            provide: PaystackService,
            useFactory() {
                return new PaystackService(paystackConfiguration);
            },
        },
    ],
    exports: [PaystackService],
})
export class PaymentWorkflowModule {}
