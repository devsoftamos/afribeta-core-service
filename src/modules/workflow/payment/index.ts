import { paystackConfiguration } from "@/config";
import { TransactionService } from "@/modules/api/transaction/services";
import { PrismaService } from "@/modules/core/prisma/services";
import { Global, Module } from "@nestjs/common";
import { PaystackService } from "./services/paystack";

@Global()
@Module({
    providers: [
        {
            provide: PaystackService,
            useFactory(
                transactionService: TransactionService,
                prisma: PrismaService
            ) {
                return new PaystackService(
                    paystackConfiguration,
                    transactionService,
                    prisma
                );
            },
            inject: [TransactionService, PrismaService],
        },
    ],
    exports: [PaystackService],
})
export class PaymentWorkflowModule {}
