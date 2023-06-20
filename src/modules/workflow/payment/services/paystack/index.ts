import {
    AssignDynamicVirtualAccountWithValidationOptions,
    Paystack,
    PaystackError,
    PaystackOptions,
} from "@/libs/paystack";
import { TransactionShortDescription } from "@/modules/api/transaction";
import { TransactionService } from "@/modules/api/transaction/services";
import { PrismaService } from "@/modules/core/prisma/services";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    TransactionFlow,
    TransactionStatus,
    TransactionType,
} from "@prisma/client";
import {
    PaystackBankException,
    PaystackTransferException,
    PaystackVerifyTransactionException,
    PaystackWorkflowException,
} from "../../errors";
import {
    InitializeTransferOptions,
    ListBanks,
    ResolveAccountOptions,
    ResolveAccountResponse,
    VerifyTransactionResponse,
} from "../../interfaces";

@Injectable()
export class PaystackService {
    private paystack: Paystack = new Paystack(this.instanceOptions);
    constructor(
        public instanceOptions: PaystackOptions,
        private transactionService: TransactionService,
        private prisma: PrismaService
    ) {
        //super(instanceOptions);
    }

    async assignDynamicValidatedVirtualAccount(
        options: AssignDynamicVirtualAccountWithValidationOptions
    ) {
        return this.paystack.assignDynamicValidatedVirtualAccount(options);
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
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new PaystackWorkflowException(
                        "Failed to retrieve banks",
                        HttpStatus.INTERNAL_SERVER_ERROR
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
            switch (true) {
                case error instanceof PaystackError: {
                    const clientError = [400, 404];

                    if (clientError.includes(error.status)) {
                        throw new PaystackBankException(
                            error.message,
                            error.status
                        );
                    } else {
                        throw new PaystackBankException(
                            error.message,
                            HttpStatus.INTERNAL_SERVER_ERROR
                        );
                    }
                }

                default: {
                    throw new PaystackWorkflowException(
                        "Failed to resolve bank account. Please try again",
                        HttpStatus.INTERNAL_SERVER_ERROR
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
            const reference = this.transactionService.generateId({
                type: "reference",
            });
            const transactionId = this.transactionService.generateId({
                type: "transaction",
            });

            await this.prisma.$transaction(async (tx) => {
                await tx.transaction.create({
                    data: {
                        amount: options.amount,
                        flow: TransactionFlow.OUT,
                        status: TransactionStatus.PENDING,
                        totalAmount: options.amount + options.serviceCharge,
                        type: TransactionType.TRANSFER_FUND,
                        userId: options.userId,
                        transactionId: transactionId,
                        serviceCharge: options.serviceCharge,
                        destinationBankAccountName: options.accountName,
                        destinationBankName: options.bankName,
                        destinationBankAccountNumber: options.accountNumber,
                        paymentReference: reference,
                        shortDescription:
                            TransactionShortDescription.TRANSFER_FUND,
                    },
                });
                await this.paystack.initiateTransfer({
                    amount: options.amount * 100,
                    recipient: generateRecipient.data.recipient_code,
                    source: "balance",
                    reference: reference,
                    reason: "Wallet withdrawal",
                });
            });
        } catch (error) {
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
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new PaystackWorkflowException(
                        "Failed to initialize transfer",
                        HttpStatus.INTERNAL_SERVER_ERROR
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
                    HttpStatus.INTERNAL_SERVER_ERROR
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
                            error.message,
                            HttpStatus.INTERNAL_SERVER_ERROR
                        );
                    }
                }

                default: {
                    throw new PaystackWorkflowException(
                        "Failed to initialize transfer",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }
}
