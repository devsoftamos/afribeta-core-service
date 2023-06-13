import {
    AssignDynamicVirtualAccountWithValidationOptions,
    PaystackError,
} from "@/libs/paystack";
import { PrismaService } from "@/modules/core/prisma/services";
import { PaystackService } from "@/modules/workflow/payment/services/paystack";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    PaymentStatus,
    Transaction,
    TransactionFlow,
    TransactionStatus,
    TransactionType,
    User,
    UserType,
    WalletFundTransactionFlow,
} from "@prisma/client";
import {
    DuplicateUserException,
    UserNotFoundException,
} from "@/modules/api/user";
import { UserService } from "@/modules/api/user/services";
import {
    InitializeWalletFundingDto,
    InitializeWithdrawalDto,
    InitiateWalletCreationDto,
    PaymentProvider,
} from "../dto";
import {
    WalletCreationException,
    WalletCreationPaystackException,
    DuplicateWalletException,
    WalletNotFoundException,
    InvalidWalletFundTransactionFlow,
    DuplicateSelfFundWalletTransaction,
    InvalidWalletWithdrawalPaymentProvider,
    InsufficientWalletBalanceException,
    DuplicateWalletWithdrawalTransaction,
} from "../errors";
import {
    CreateWalletAAndVirtualAccount,
    ProcessWalletFundOptions,
    ProcessWalletWithdrawalOptions,
} from "../interfaces";
import logger from "moment-logger";
import { ApiResponse, buildResponse } from "@/utils/api-response-util";
import { isProduction } from "@/config";
import { TransactionService } from "../../transaction/services";
import {
    TransactionNotFoundException,
    TransactionShortDescription,
} from "../../transaction";

@Injectable()
export class WalletService {
    constructor(
        private prisma: PrismaService,
        private paystackService: PaystackService,
        private userService: UserService,
        private transactionService: TransactionService
    ) {}

    async createUserWalletAndVirtualAccount(
        options: CreateWalletAAndVirtualAccount
    ) {
        try {
            const user = await this.userService.findUserByEmail(options.email);
            if (!user) {
                logger.error(
                    new UserNotFoundException(
                        "Could not find user to create wallet and virtual account",
                        HttpStatus.NOT_FOUND
                    )
                );
                return false;
            }
            const wallet = await this.prisma.wallet.findUnique({
                where: { userId: user.id },
            });

            if (wallet) {
                logger.error(
                    new DuplicateWalletException(
                        `Wallet already exists for user ${user.email}`,
                        HttpStatus.BAD_REQUEST
                    )
                );
                return false;
            }

            //create record
            await this.prisma.$transaction(async (tx) => {
                await tx.wallet.create({
                    data: { userId: user.id },
                });

                await tx.virtualBankAccount.create({
                    data: {
                        accountName: options.accountName,
                        accountNumber: options.accountNumber,
                        bankName: options.bankName,
                        provider: options.provider,
                        userId: user.id,
                        customerCode: options.customerCode,
                        slug: options.providerBankSlug,
                    },
                });
            });
        } catch (error) {
            logger.error(error);
        }
    }

    async initiateCustomerWalletCreation(
        options: InitiateWalletCreationDto,
        user: User
    ) {
        try {
            const wallet = await this.prisma.wallet.findUnique({
                where: { userId: user.id },
            });

            if (user.userType !== "CUSTOMER") {
                throw new WalletCreationException(
                    "User must be of customer type",
                    HttpStatus.BAD_REQUEST
                );
            }

            if (wallet) {
                throw new DuplicateWalletException(
                    "Wallet already exists",
                    HttpStatus.BAD_REQUEST
                );
            }

            const testData = {
                country: "NG",
                type: "bank_account",
                account_number: "0111111111",
                bvn: "22222222222",
                bank_code: "007",
                first_name: "Uchenna",
                last_name: "Okoro",
                email: "uche@example.com",
            };

            const paystackDynamicVirtualAccountCreationOptions: AssignDynamicVirtualAccountWithValidationOptions =
                {
                    bvn: options.bvn,
                    account_number: options.accountNumber,
                    bank_code: options.bankCode,
                    country: "NG",
                    email: user.email,
                    first_name: user.firstName,
                    last_name: user.lastName,
                    phone: `+234${user.phone.substring(1)}`,
                    preferred_bank: "wema-bank",
                };

            const data = isProduction
                ? paystackDynamicVirtualAccountCreationOptions
                : testData;

            await this.paystackService.assignDynamicValidatedVirtualAccount(
                data as any
            );
            return buildResponse({
                message:
                    "Your Afribeta wallet would be created after we have successfully verified your bank details",
            });
        } catch (error) {
            switch (true) {
                case error instanceof DuplicateUserException: {
                    throw error;
                }

                case error instanceof WalletCreationException: {
                    throw error;
                }

                case error instanceof PaystackError: {
                    throw new WalletCreationPaystackException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw error;
                }
            }
        }
    }

    //Process wallet funding
    async processWalletFunding(options: ProcessWalletFundOptions) {
        switch (options.walletFundTransactionFlow) {
            //self wallet fund
            case WalletFundTransactionFlow.SELF_FUND: {
                await this.handleSelfWalletFund(options);
                break;
            }

            default: {
                throw new InvalidWalletFundTransactionFlow(
                    "Invalid wallet fund transaction flow",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        }
    }

    //self wallet fund handler
    async handleSelfWalletFund(options: ProcessWalletFundOptions) {
        const transaction = await this.prisma.transaction.findFirst({
            where: {
                paymentReference: options.paymentReference,
                paymentStatus: PaymentStatus.SUCCESS,
            },
        });

        if (transaction) {
            throw new DuplicateSelfFundWalletTransaction(
                "Wallet fund transaction already completed",
                HttpStatus.BAD_REQUEST
            );
        }

        const wallet = await this.prisma.wallet.findUnique({
            where: { userId: options.userId },
        });

        if (!wallet) {
            throw new WalletNotFoundException(
                "User wallet to be funded not found",
                HttpStatus.NOT_FOUND
            );
        }

        //Handle DB transactions
        await this.prisma.$transaction(async (tx) => {
            //update wallet idf status is success
            await tx.wallet.update({
                where: { userId: options.userId },
                data: {
                    mainBalance: { increment: options.amount },
                },
            });

            await tx.transaction.upsert({
                where: {
                    paymentReference: options.paymentReference,
                },
                update: {
                    status: TransactionStatus.SUCCESS,
                    paymentStatus: PaymentStatus.SUCCESS,
                },
                create: {
                    //for virtual account transfer
                    amount: options.amount,
                    userId: options.userId,
                    status: options.status,
                    totalAmount: options.amount,
                    flow: TransactionFlow.IN,
                    type: TransactionType.WALLET_FUND,
                    paymentStatus: options.paymentStatus,
                    paymentChannel: options.paymentChannel,
                    paymentReference: options.paymentReference,
                    transactionId: this.transactionService.generateId({
                        type: "transaction",
                    }),
                    shortDescription: TransactionShortDescription.WALLET_FUNDED,
                    walletFundTransactionFlow:
                        options.walletFundTransactionFlow,
                },
            });
        });
    }

    // wallet funding --- currently paystack
    async initializeWalletFunding(
        options: InitializeWalletFundingDto,
        user: User
    ): Promise<ApiResponse> {
        const paymentReference = this.transactionService.generateId({
            type: "reference",
        });
        const transactionId = this.transactionService.generateId({
            type: "transaction",
        });

        const createdTransaction = await this.prisma.transaction.create({
            data: {
                amount: options.amount,
                totalAmount: options.amount,
                flow: TransactionFlow.IN,
                type: TransactionType.WALLET_FUND,
                userId: user.id,
                paymentStatus: PaymentStatus.PENDING,
                status: TransactionStatus.PENDING,
                paymentChannel: options.paymentChannel,
                paymentReference: paymentReference,
                shortDescription: TransactionShortDescription.WALLET_FUNDED,
                walletFundTransactionFlow: WalletFundTransactionFlow.SELF_FUND,
                transactionId: transactionId,
            },
        });

        return buildResponse({
            message: "Reference successfully generated",
            data: {
                reference: createdTransaction.paymentReference,
            },
        });
    }

    //Withdraw fund from wallet to bank account
    async initializeWalletWithdrawal(
        options: InitializeWithdrawalDto,
        user: User
    ): Promise<ApiResponse> {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId: user.id },
        });
        if (!wallet) {
            throw new WalletNotFoundException(
                "Wallet could not be found",
                HttpStatus.NOT_FOUND
            );
        }

        const theUser = await this.userService.findUserById(user.id);
        if (theUser.userType == UserType.CUSTOMER) {
            if (options.amount > wallet.mainBalance) {
                throw new InsufficientWalletBalanceException(
                    "Insufficient balance",
                    HttpStatus.BAD_REQUEST
                );
            }
        } else {
            if (options.amount > wallet.commissionBalance) {
                throw new InsufficientWalletBalanceException(
                    "Insufficient commission balance",
                    HttpStatus.BAD_REQUEST
                );
            }
        }

        switch (options.paymentProvider) {
            case PaymentProvider.PAYSTACK: {
                await this.paystackService.initializeTransfer({
                    accountName: options.accountName,
                    accountNumber: options.accountNumber,
                    amount: options.amount,
                    serviceCharge: options.serviceCharge,
                    bankCode: options.bankCode,
                    bankName: options.bankName,
                    userId: user.id,
                });
                return buildResponse({
                    message: "Transfer successfully initiated",
                });
            }

            default: {
                throw new InvalidWalletWithdrawalPaymentProvider(
                    "Invalid wallet withdrawal payment provider selected",
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    async processWalletWithdrawal(options: ProcessWalletWithdrawalOptions) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { paymentReference: options.paymentReference },
        });
        if (!transaction) {
            throw new TransactionNotFoundException(
                "Failed to update wallet withdrawal status. Transaction Reference not be found",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.status == TransactionStatus.SUCCESS) {
            throw new DuplicateWalletWithdrawalTransaction(
                "Wallet withdrawal transaction already completed",
                HttpStatus.BAD_REQUEST
            );
        }

        switch (options.paymentStatus) {
            case PaymentStatus.SUCCESS: {
                await this.updateWalletWithdrawalSuccessRecords(transaction);
                break;
            }
            case PaymentStatus.FAILED: {
                await this.prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        paymentStatus: PaymentStatus.FAILED,
                        status: TransactionStatus.FAILED,
                    },
                });
            }

            default:
                break;
        }
    }

    async updateWalletWithdrawalSuccessRecords(transaction: Transaction) {
        const user = await this.userService.findUserById(transaction.userId);
        if (!user) {
            throw new UserNotFoundException(
                "Failed to update wallet withdrawal status. User not found",
                HttpStatus.NOT_FOUND
            );
        }
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId: user.id },
        });
        if (!wallet) {
            throw new WalletNotFoundException(
                "Failed to update wallet withdrawal status. User wallet not found",
                HttpStatus.NOT_FOUND
            );
        }
        await this.prisma.$transaction(async (tx) => {
            if (user.userType == UserType.CUSTOMER) {
                await tx.wallet.update({
                    where: { userId: user.id },
                    data: {
                        mainBalance: {
                            decrement: transaction.amount,
                        },
                    },
                });
            } else {
                await tx.wallet.update({
                    where: { userId: user.id },
                    data: {
                        commissionBalance: {
                            decrement: transaction.amount,
                        },
                    },
                });
            }
            await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: TransactionStatus.SUCCESS,
                    paymentStatus: PaymentStatus.SUCCESS,
                },
            });
        });
    }
}
