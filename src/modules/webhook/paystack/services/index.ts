import { CreateWalletAAndVirtualAccount } from "@/modules/api/wallet";
import { WalletService } from "@/modules/api/wallet/services";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    DedicatedAccountAssignSuccessData,
    EventBody,
    Event,
    PaystackWebhook,
    ChargeSuccessData,
    Channel,
} from "../interfaces";
import logger from "moment-logger";
import {
    PaymentChannel,
    PaymentStatus,
    TransactionStatus,
    VirtualAccountProviders,
    WalletFundTransactionFlow,
} from "@prisma/client";
import { UserService } from "@/modules/api/user/services";
import { UserNotFoundException } from "@/modules/api/user";

@Injectable()
export class PaystackWebhookService implements PaystackWebhook {
    constructor(
        private walletService: WalletService,
        private userService: UserService
    ) {}

    async processWebhookEvent(eventBody: EventBody) {
        try {
            console.log(eventBody, "*****************");
            switch (eventBody.event) {
                case Event.DedicatedAssignSuccessEvent: {
                    await this.dedicatedAccountAssignSuccessHandler(
                        eventBody.data as DedicatedAccountAssignSuccessData
                    );
                    break;
                }
                case Event.ChargeSuccessEvent: {
                    await this.chargeSuccessHandler(
                        eventBody.data as ChargeSuccessData
                    );
                }

                default:
                    break;
            }
        } catch (error) {
            logger.error(error);
        }
    }
    async dedicatedAccountAssignSuccessHandler(
        eventData: DedicatedAccountAssignSuccessData
    ) {
        const createWalletAccountOptions: CreateWalletAAndVirtualAccount = {
            customerCode: eventData.customer.customer_code,
            accountName: eventData.dedicated_account.account_name,
            accountNumber: eventData.dedicated_account.account_number,
            bankName: eventData.dedicated_account.bank.name,
            email: eventData.customer.email,
            provider: VirtualAccountProviders.PAYSTACK,
            providerBankSlug: eventData.dedicated_account.bank.slug,
        };

        await this.walletService.createUserWalletAndVirtualAccount(
            createWalletAccountOptions
        );
    }

    async chargeSuccessHandler(eventData: ChargeSuccessData) {
        switch (true) {
            case eventData.channel == Channel.DEDICATED_NUBAN: {
                //fund wallet via virtual account transfer
                await this.chargeSuccessWalletFundHandler(eventData);
                break;
            }
            case eventData.metadata.wallet_fund: {
                //fund wallet via any paystack channel
                await this.chargeSuccessWalletFundHandler(eventData);
                break;
            }
            default:
                break;
        }
    }

    //handle wallet funding from paystack virtual bank account transfer
    async chargeSuccessWalletFundHandler(eventData: ChargeSuccessData) {
        try {
            const user = await this.userService.findUserByEmail(
                eventData.customer.email
            );
            if (!user) {
                throw new UserNotFoundException(
                    `Unable to find user with email, ${eventData.customer.email} for wallet crediting`,
                    HttpStatus.NOT_FOUND
                );
            }
            const amount = eventData.amount / 100;
            await this.walletService.walletFundHandler({
                amount: amount,
                status: TransactionStatus.SUCCESS,
                userId: user.id,
                paymentChannel:
                    eventData.channel == Channel.DEDICATED_NUBAN
                        ? PaymentChannel.PAYSTACK_VIRTUAL_ACCOUNT_TRANSFER
                        : PaymentChannel.PAYSTACK_CHANNEL,
                paymentReference: eventData.reference,
                paymentStatus: PaymentStatus.SUCCESS,
                walletFundTransactionFlow: WalletFundTransactionFlow.SELF_FUND,
            });
        } catch (error) {
            logger.error(error);
        }
    }
}
