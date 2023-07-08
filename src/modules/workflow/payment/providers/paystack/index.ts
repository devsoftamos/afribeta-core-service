import { paystackConfiguration } from "@/config";
import { Paystack } from "@/libs/paystack";
import { PrismaService } from "@/modules/core/prisma/services";
import { Global, Module } from "@nestjs/common";
import { PaystackService } from "./services";

@Global()
@Module({
    providers: [
        {
            provide: PaystackService,
            useFactory(prisma: PrismaService) {
                const paystack: Paystack = new Paystack(paystackConfiguration);

                return new PaystackService(paystack, prisma);
            },
            inject: [PrismaService],
        },
    ],
    exports: [PaystackService],
})
export class PaystackWorkflowModule {}
