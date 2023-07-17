import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { PaymentStatus, TransactionType } from "@prisma/client";
import { ProcessBillPaymentOptions, WalletDebitHandler } from "../interfaces";
import logger from "moment-logger";
import { PowerBillService } from "./power";
import { DataBillService } from "./data";
import { PrismaService } from "@/modules/core/prisma/services";
import { DB_TRANSACTION_TIMEOUT } from "@/config";

@Injectable()
export class BillService {
    constructor(
        @Inject(forwardRef(() => PowerBillService))
        private powerBillService: PowerBillService,

        @Inject(forwardRef(() => DataBillService))
        private dataBillService: DataBillService,

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
            case TransactionType.DATA_PURCHASE: {
                await this.dataBillService.processWebhookDataPurchase({
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

    async walletDebitHandler(options: WalletDebitHandler) {
        await this.prisma.$transaction(
            async (tx) => {
                await tx.wallet.update({
                    where: {
                        id: options.walletId,
                    },
                    data: {
                        mainBalance: {
                            decrement: options.amount,
                        },
                    },
                });

                await tx.transaction.update({
                    where: {
                        id: options.transactionId,
                    },
                    data: {
                        paymentStatus: PaymentStatus.SUCCESS,
                    },
                });
            },
            {
                timeout: DB_TRANSACTION_TIMEOUT,
            }
        );
    }
}
