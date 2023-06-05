import {
    CreateWalletAccount,
    VirtualAccountProviders,
} from "@/modules/api/wallet";
import { WalletService } from "@/modules/api/wallet/services";
import { Injectable } from "@nestjs/common";
import {
    DedicatedAccountAssignSuccessData,
    EventBody,
    Event,
    PaystackWebhook,
} from "../interfaces";
import logger from "moment-logger";

@Injectable()
export class PaystackWebhookService implements PaystackWebhook {
    constructor(private walletService: WalletService) {}

    async processWebhookEvent(eventBody: EventBody) {
        try {
            switch (eventBody.event) {
                case Event.DedicatedAssignSuccessEvent: {
                    await this.dedicatedAccountAssignSuccessHandler(
                        eventBody.data
                    );
                    break;
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
        const createWalletAccountOptions: CreateWalletAccount = {
            customerCode: eventData.customer.customer_code,
            accountName: eventData.dedicated_account.account_name,
            accountNumber: eventData.dedicated_account.account_number,
            bankName: eventData.dedicated_account.bank.name,
            email: eventData.customer.email,
            provider: VirtualAccountProviders.Paystack,
        };

        await this.walletService.createUserWalletAccount(
            createWalletAccountOptions
        );
    }
}
