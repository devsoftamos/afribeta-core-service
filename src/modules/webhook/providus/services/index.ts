import {
    DuplicateSelfFundWalletTransaction,
    WalletFundProvider,
} from "@/modules/api/wallet";
import { WalletService } from "@/modules/api/wallet/services";
import { Injectable } from "@nestjs/common";
import {
    PaymentChannel,
    PaymentStatus,
    TransactionStatus,
    WalletFundTransactionFlow,
} from "@prisma/client";
import logger from "moment-logger";
import { APIWebhookResponse, EventBody, UserIdentifier } from "../interfaces";

@Injectable()
export class ProvidusWebhookService {
    constructor(private walletService: WalletService) {}
    async processWebhookEvent(eventBody: EventBody, user: UserIdentifier) {
        return await this.processWalletFunding(eventBody, user);
    }

    //handle wallet funding from paystack virtual bank account transfer
    async processWalletFunding(eventBody: EventBody, user: UserIdentifier) {
        try {
            await this.walletService.processWalletFunding({
                amount: +eventBody.transactionAmount,
                status: TransactionStatus.SUCCESS,
                userId: user.id,
                paymentChannel:
                    PaymentChannel.PROVIDUS_VIRTUAL_ACCOUNT_TRANSFER,
                paymentReference: eventBody.settlementId,
                paymentStatus: PaymentStatus.SUCCESS,
                walletFundTransactionFlow: WalletFundTransactionFlow.SELF_FUND,
                provider: WalletFundProvider.PROVIDUS,
            });

            const resp: APIWebhookResponse = {
                requestSuccessful: true,
                responseCode: "00",
                responseMessage: "success",
                sessionId: eventBody.sessionId,
            };
            return resp;
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof DuplicateSelfFundWalletTransaction: {
                    const resp: APIWebhookResponse = {
                        requestSuccessful: true,
                        responseCode: "01",
                        responseMessage: "duplicate transaction",
                        sessionId: eventBody.sessionId,
                    };
                    return resp;
                }

                default: {
                    const resp: APIWebhookResponse = {
                        requestSuccessful: true,
                        responseCode: "03",
                        responseMessage: "system failure",
                        sessionId: eventBody.sessionId,
                    };
                    return resp;
                }
            }
        }
    }
}
