import { forwardRef, Inject, Injectable } from "@nestjs/common";
import {
    PaymentStatus,
    Transaction,
    TransactionStatus,
    TransactionType,
} from "@prisma/client";
import { ProcessBillPaymentOptions } from "../interfaces";
import logger from "moment-logger";
import { PowerBillService } from "./power";
import { PrismaService } from "@/modules/core/prisma/services";
import { DB_TRANSACTION_TIMEOUT } from "@/config";

@Injectable()
export class BillService {
    constructor(
        @Inject(forwardRef(() => PowerBillService))
        private powerBillService: PowerBillService,
        private prisma: PrismaService
    ) {}

    async handleWebhookSuccessfulBillPayment(
        options: ProcessBillPaymentOptions
    ) {
        switch (options.billType) {
            case TransactionType.ELECTRICITY_BILL: {
                await this.powerBillService.processWebhookPowerPurchase({
                    billType: options.billType,
                    paymentReference: options.paymentReference,
                });
                break;
            }

            default: {
                logger.error(
                    "Failed to complete bill purchase. Invalid bill type"
                );
            }
        }
    }

    async handleFailedBillPaymentFromProvider(transaction: Transaction) {
        //revert debit
        await this.prisma.$transaction(
            async (tx) => {
                await tx.transaction.update({
                    where: {
                        id: transaction.id,
                    },
                    data: {
                        status: TransactionStatus.FAILED,
                        paymentStatus: PaymentStatus.FAILED,
                    },
                });

                await tx.wallet.update({
                    where: {
                        userId: transaction.userId,
                    },
                    data: {
                        mainBalance: {
                            increment: transaction.amount,
                        },
                    },
                });
            },
            {
                timeout: DB_TRANSACTION_TIMEOUT,
            }
        );
    }
}
