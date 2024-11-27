import {
    AssignDedicatedVirtualAccountWithValidationOptions,
    Paystack,
    PaystackError,
} from "@/libs/paystack";
import {
    TransactionShortDescription,
    TransferServiceProvider,
} from "@/modules/api/transaction";
import { PrismaService } from "@/modules/core/prisma/services";
import { generateId } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    PaymentChannel,
    PaymentStatus,
    TransactionFlow,
    TransactionStatus,
    TransactionType,
    UserType,
} from "@prisma/client";
import {
    PaystackBankException,
    PaystackDynamicVirtualAccountException,
    PaystackTransferException,
    PaystackVerifyTransactionException,
    PaystackWorkflowException,
} from "../errors";
import {
    InitializeTransferOptions,
    ListBanks,
    ResolveAccountOptions,
    ResolveAccountResponse,
    VerifyTransactionResponse,
} from "../../../interfaces";
import logger from "moment-logger";

@Injectable()
export class PaystackService {
    constructor(private paystack: Paystack, private prisma: PrismaService) {}

    async assignDedicatedValidatedVirtualAccount(
        options: AssignDedicatedVirtualAccountWithValidationOptions
    ) {
        try {
            const resp = await this.paystack.assignDedicatedVirtualAccount(
                options
            );
            return resp;
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof PaystackError: {
                    throw new PaystackDynamicVirtualAccountException(
                        "operation failed",
                        HttpStatus.NOT_IMPLEMENTED
                    );
                }

                default: {
                    throw new PaystackWorkflowException(
                        "Failed to initiate dynamic virtual account creation",
                        HttpStatus.NOT_IMPLEMENTED
                    );
                }
            }
        }
    }

    async getBankList(): Promise<ListBanks[]> {
        try {
            const list = await this.paystack.getBanks({ country: "nigeria" });
            return list.data.map((bank) => ({
                code: bank.code,
                name: bank.name,
            }));
        } catch (error) {
            switch (true) {
                case error instanceof PaystackError: {
                    throw new PaystackBankException(
                        "operation failed",
                        HttpStatus.BAD_REQUEST
                    );
                }

                default: {
                    throw new PaystackWorkflowException(
                        "Failed to retrieve banks",
                        HttpStatus.BAD_REQUEST
                    );
                }
            }
        }
    }

    async resolveAccountNumber(
        options: ResolveAccountOptions
    ): Promise<ResolveAccountResponse> {
        try {
            const resp = await this.paystack.resolveBankAccount({
                account_number: options.accountNumber,
                bank_code: options.bankCode,
            });
            return {
                accountName: resp.data.account_name,
                accountNumber: resp.data.account_number,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof PaystackError: {
                    const clientError = [400, 404, 422];

                    if (clientError.includes(error.status)) {
                        throw new PaystackBankException(
                            error.message,
                            error.status
                        );
                    } else {
                        throw new PaystackBankException(
                            error.message,
                            HttpStatus.BAD_REQUEST
                        );
                    }
                }

                default: {
                    throw new PaystackWorkflowException(
                        "Failed to resolve bank account. Please try again",
                        HttpStatus.BAD_REQUEST
                    );
                }
            }
        }
    }

    async initializeTransfer(options: InitializeTransferOptions) {
        try {
            //reconfirm account details
            await this.resolveAccountNumber({
                accountNumber: options.accountNumber,
                bankCode: options.bankCode,
            });

            const generateRecipient =
                await this.paystack.createTransferRecipient({
                    account_number: options.accountNumber,
                    bank_code: options.bankCode,
                    currency: "NGN",
                    type: "nuban",
                    name: options.accountName,
                });
            if (!generateRecipient || !generateRecipient.status) {
                throw new PaystackTransferException(
                    "Failed to generate recipient code.",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            //initiate transfer
            const transactionId = generateId({
                type: "transaction",
            });
            const totalAmount = options.amount + options.serviceCharge;

            await this.prisma.$transaction(async (tx) => {
                await tx.transaction.create({
                    data: {
                        amount: options.amount,
                        provider: TransferServiceProvider.PAYSTACK,
                        flow: TransactionFlow.OUT,
                        status: TransactionStatus.PENDING,
                        paymentStatus: PaymentStatus.SUCCESS,
                        totalAmount: totalAmount,
                        type: TransactionType.TRANSFER_FUND,
                        userId: options.userId,
                        transactionId: transactionId,
                        serviceCharge: options.serviceCharge,
                        destinationBankAccountName: options.accountName,
                        destinationBankName: options.bankName,
                        destinationBankAccountNumber: options.accountNumber,
                        paymentReference: options.reference,
                        shortDescription:
                            TransactionShortDescription.TRANSFER_FUND,
                        paymentChannel: PaymentChannel.PAYSTACK_CHANNEL,
                    },
                });
                if (options.userType == UserType.CUSTOMER) {
                    await tx.wallet.update({
                        where: { userId: options.userId },
                        data: {
                            mainBalance: {
                                decrement: totalAmount,
                            },
                        },
                    });
                } else {
                    await tx.wallet.update({
                        where: { userId: options.userId },
                        data: {
                            commissionBalance: {
                                decrement: totalAmount,
                            },
                        },
                    });
                }
                await this.paystack.initiateTransfer({
                    amount: options.amount * 100,
                    recipient: generateRecipient.data.recipient_code,
                    source: "balance",
                    reference: options.reference,
                    reason: "Wallet withdrawal",
                });
            });
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof PaystackBankException: {
                    throw error;
                }

                case error instanceof PaystackWorkflowException: {
                    throw error;
                }

                case error instanceof PaystackTransferException: {
                    throw error;
                }

                case error instanceof PaystackError: {
                    throw new PaystackTransferException(
                        "operation failed",
                        HttpStatus.NOT_IMPLEMENTED
                    );
                }

                default: {
                    throw new PaystackWorkflowException(
                        "Failed to initialize transfer",
                        HttpStatus.NOT_IMPLEMENTED
                    );
                }
            }
        }
    }

    async verifyTransaction(
        reference: string
    ): Promise<VerifyTransactionResponse> {
        try {
            const resp = await this.paystack.verifyTransaction(reference);

            if (!resp || !resp.data) {
                throw new PaystackWorkflowException(
                    "Unable to verify paystack transaction",
                    HttpStatus.NOT_IMPLEMENTED
                );
            }

            switch (resp.data.status) {
                case "success": {
                    return { status: "success" };
                }
                case "abandoned": {
                    return { status: "cancelled" };
                }
                case "failed": {
                    return { status: "failed" };
                }

                default: {
                    throw new PaystackWorkflowException(
                        "Invalid paystack transaction status",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        } catch (error) {
            switch (true) {
                case error instanceof PaystackWorkflowException: {
                    throw error;
                }
                case error instanceof PaystackError: {
                    const clientError = [400, 404];

                    if (clientError.includes(error.status)) {
                        throw new PaystackVerifyTransactionException(
                            error.message,
                            error.status
                        );
                    } else {
                        throw new PaystackVerifyTransactionException(
                            "operation failed",
                            HttpStatus.NOT_IMPLEMENTED
                        );
                    }
                }

                default: {
                    throw new PaystackWorkflowException(
                        "Failed to verify transfer",
                        HttpStatus.NOT_IMPLEMENTED
                    );
                }
            }
        }
    }
}
