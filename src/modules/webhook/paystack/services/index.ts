import {
    CreateWalletAAndVirtualAccount,
    WalletFundProvider,
} from "@/modules/api/wallet";
import { WalletService } from "@/modules/api/wallet/services";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    DedicatedAccountAssignSuccessData,
    EventBody,
    Event,
    PaystackWebhook,
    ChargeSuccessData,
    Channel,
    TransferData,
} from "../interfaces";
import logger from "moment-logger";
import {
    PaymentChannel,
    PaymentStatus,
    TransactionStatus,
    TransactionType,
    VirtualAccountProvider,
    WalletFundTransactionFlow,
} from "@prisma/client";
import { UserService } from "@/modules/api/user/services";
import { UserNotFoundException } from "@/modules/api/user";
import { TransactionService } from "@/modules/api/transaction/services";
import { TransactionNotFoundException } from "@/modules/api/transaction";
import { BillService } from "@/modules/api/bill/services";

@Injectable()
export class PaystackWebhookService implements PaystackWebhook {
    constructor(
        private walletService: WalletService,
        private userService: UserService,
        private transactionService: TransactionService,
        private billService: BillService
    ) {}

    async processWebhookEvent(eventBody: EventBody) {
        //console.log(eventBody, "****DATA****");

        try {
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
                    break;
                }
                case Event.TransferSuccessEvent: {
                    await this.transferSuccessHandler(
                        eventBody.data as TransferData
                    );
                    break;
                }
                case Event.TransferFailedEvent: {
                    await this.transferFailedHandler(
                        eventBody.data as TransferData
                    );
                    break;
                }
                case Event.TransferReversedEvent: {
                    await this.transferFailedHandler(
                        eventBody.data as TransferData
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
        const createWalletAccountOptions: CreateWalletAAndVirtualAccount = {
            customerCode: eventData.customer.customer_code,
            accountName: eventData.dedicated_account.account_name,
            accountNumber: eventData.dedicated_account.account_number,
            bankName: eventData.dedicated_account.bank.name,
            email: eventData.customer.email,
            provider: VirtualAccountProvider.PAYSTACK,
            providerBankSlug: eventData.dedicated_account.bank.slug,
        };

        await this.walletService.processWebhookWalletAndVirtualAccountCreation(
            createWalletAccountOptions
        );
    }

    async chargeSuccessHandler(eventData: ChargeSuccessData) {
        switch (true) {
            case eventData.channel == Channel.DEDICATED_NUBAN: {
                //fund wallet via virtual account transfer
                await this.processWalletFunding(eventData);
                break;
            }
            default: {
                //other successful payment
                await this.chargeSuccessProcessor(eventData);
                break;
            }
        }
    }

    //handle wallet funding from paystack virtual bank account transfer
    async processWalletFunding(eventData: ChargeSuccessData) {
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
            await this.walletService.processWalletFunding({
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
                provider: WalletFundProvider.PAYSTACK,
            });
        } catch (error) {
            logger.error(error);
        }
    }

    async chargeSuccessProcessor(eventData: ChargeSuccessData) {
        try {
            const transaction =
                await this.transactionService.getTransactionByPaymentReference(
                    eventData.reference
                );
            if (!transaction) {
                throw new TransactionNotFoundException(
                    "Paystack transaction payment reference not found",
                    HttpStatus.NOT_FOUND
                );
            }
            //Wallet funding
            if (transaction.type == TransactionType.WALLET_FUND) {
                // console.log(eventData, "************WEBHOOK*********");

                await this.processWalletFunding(eventData);
            } else {
                //Bill payment
                //console.log(eventData, "************WEBHOOK*********");
                await this.billService.handleWebhookSuccessfulBillPayment({
                    billType: transaction.type,
                    paymentReference: transaction.paymentReference,
                });
            }
        } catch (error) {
            logger.error(error);
        }
    }

    async transferSuccessHandler(eventData: TransferData) {
        try {
            await this.walletService.processWalletWithdrawal({
                paymentReference: eventData.reference,
                paymentStatus: PaymentStatus.SUCCESS,
            });
        } catch (error) {
            logger.error(error);
        }
    }
    async transferFailedHandler(eventData: TransferData) {
        try {
            await this.walletService.processWalletWithdrawal({
                paymentReference: eventData.reference,
                paymentStatus: PaymentStatus.FAILED,
            });
        } catch (error) {
            logger.error(error);
        }
    }
}
