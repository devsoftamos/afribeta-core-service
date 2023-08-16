import { WalletService } from "@/modules/api/wallet/services";
import { HttpStatus, Injectable } from "@nestjs/common";
import { EventBody } from "../interfaces";
import logger from "moment-logger";
import { PrismaService } from "@/modules/core/prisma/services";
import {
    PaymentChannel,
    PaymentStatus,
    TransactionStatus,
    VirtualAccountProvider,
    WalletFundTransactionFlow,
} from "@prisma/client";
import { VirtualAccountNotFoundException } from "@/modules/api/bank";
import { WalletFundProvider } from "@/modules/api/wallet";

@Injectable()
export class FSDH360BankWebhookService {
    constructor(
        private walletService: WalletService,
        private prisma: PrismaService
    ) {}

    async processWebhookEvent(eventBody: EventBody) {
        await this.processWalletFunding(eventBody);
    }

    private async processWalletFunding(eventBody: EventBody) {
        try {
            const virtualAccount =
                await this.prisma.virtualBankAccount.findUnique({
                    where: {
                        accountNumber_provider: {
                            accountNumber: eventBody.virtualAccountNumber,
                            provider: VirtualAccountProvider.FSDH360,
                        },
                    },
                });

            if (!virtualAccount) {
                throw new VirtualAccountNotFoundException(
                    "Failed to process FSDH360 webhook virtual account funding. User virtual account not found",
                    HttpStatus.NOT_FOUND
                );
            }
            await this.walletService.processWalletFunding({
                amount: eventBody.amount,
                status: TransactionStatus.SUCCESS,
                userId: virtualAccount.userId,
                paymentChannel: PaymentChannel.FSDH360_VIRTUAL_ACCOUNT_TRANSFER,
                paymentReference: eventBody.transactionId,
                paymentStatus: PaymentStatus.SUCCESS,
                walletFundTransactionFlow: WalletFundTransactionFlow.SELF_FUND,
                provider: WalletFundProvider.FSDH360,
            });
        } catch (error) {
            logger.error(error);
        }
    }
}
