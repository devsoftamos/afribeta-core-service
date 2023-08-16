import { WalletService } from "@/modules/api/wallet/services";
import { HttpStatus, Injectable } from "@nestjs/common";
import { EventBody } from "../interfaces";
import logger from "moment-logger";
import { UserService } from "@/modules/api/user/services";
import { UserNotFoundException } from "@/modules/api/user";
import {
    TransactionStatus,
    PaymentChannel,
    PaymentStatus,
    WalletFundTransactionFlow,
} from "@prisma/client";
import { WalletFundProvider } from "@/modules/api/wallet";

@Injectable()
export class SquadGTBankWebhookService {
    constructor(
        private walletService: WalletService,
        private userService: UserService
    ) {}

    async processWebhookEvent(eventBody: EventBody) {
        if (eventBody.channel == "virtual-account") {
            await this.processWalletFunding(eventBody);
        }
    }

    //handle wallet funding from gtbank virtual bank account transfer
    async processWalletFunding(eventBody: EventBody) {
        try {
            const user = await this.userService.findUserByIdentifier(
                eventBody.customer_identifier
            );
            if (!user) {
                throw new UserNotFoundException(
                    `Unable to find user with identifier, ${eventBody.customer_identifier} for GTBank wallet crediting`,
                    HttpStatus.NOT_FOUND
                );
            }

            await this.walletService.processWalletFunding({
                amount: +eventBody.principal_amount,
                status: TransactionStatus.SUCCESS,
                userId: user.id,
                paymentChannel: PaymentChannel.GTBANK_VIRTUAL_ACCOUNT_TRANSFER,
                paymentReference: eventBody.transaction_reference,
                paymentStatus: PaymentStatus.SUCCESS,
                walletFundTransactionFlow: WalletFundTransactionFlow.SELF_FUND,
                provider: WalletFundProvider.GTBANK,
            });
        } catch (error) {
            logger.error(error);
        }
    }
}
