import { paystackConfiguration } from "@/config";
import { PrismaService } from "@/modules/core/prisma/services";
import { Global, Module } from "@nestjs/common";
import { PaystackService } from "./services/paystack";

@Global()
@Module({
    providers: [
        {
            provide: PaystackService,
            useFactory(prisma: PrismaService) {
                return new PaystackService(paystackConfiguration, prisma);
            },
            inject: [PrismaService],
        },
    ],
    exports: [PaystackService],
})
export class PaymentWorkflowModule {}
