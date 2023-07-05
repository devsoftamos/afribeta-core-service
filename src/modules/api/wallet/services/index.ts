import {
    AssignDynamicVirtualAccountWithValidationOptions,
    PaystackError,
    SupportedBank,
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
    TransferToOtherWalletDto,
    VerifyWalletDto,
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
import { TransactionService } from "../../transaction/services";
import {
    TransactionNotFoundException,
    TransactionShortDescription,
} from "../../transaction";
import { customAlphabet } from "nanoid";
import { isProduction } from "@/config";
import { generateId } from "@/utils";

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
            const walletNumber = customAlphabet("1234567890ABCDEFGH", 10)();
            await this.prisma.$transaction(async (tx) => {
                await tx.wallet.create({
                    data: { userId: user.id, walletNumber: walletNumber },
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

            // const testData = {
            //     country: "NG",
            //     type: "bank_account",
            //     account_number: "0111111111",
            //     bvn: "22222222222",
            //     bank_code: "007",
            //     first_name: "Uchenna",
            //     last_name: "Okoro",
            //     email: "uche@example.com",
            // };

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
                    preferred_bank: isProduction
                        ? SupportedBank.WEMA_BANK
                        : ("test-bank" as any), // ***********************************************************
                };

            await this.paystackService.assignDynamicValidatedVirtualAccount(
                paystackDynamicVirtualAccountCreationOptions
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
                    transactionId: generateId({
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
        const paymentReference = generateId({
            type: "reference",
        });
        const transactionId = generateId({
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
                amount: options.amount,
                email: user.email,
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
        const totalAmount = options.amount + options.serviceCharge;

        if (theUser.userType == UserType.CUSTOMER) {
            if (totalAmount > wallet.mainBalance) {
                throw new InsufficientWalletBalanceException(
                    "Insufficient balance",
                    HttpStatus.BAD_REQUEST
                );
            }
        } else {
            if (totalAmount > wallet.commissionBalance) {
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
                "Failed to update wallet withdrawal status. Transaction Reference not found",
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
                await this.updateWalletWithdrawalSuccessRecords(
                    transaction,
                    options.transferCode
                );
                break;
            }
            case PaymentStatus.FAILED: {
                await this.prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        paymentStatus: PaymentStatus.FAILED,
                        status: TransactionStatus.FAILED,
                        serviceTransactionCode: options.transferCode,
                    },
                });
            }

            default:
                break;
        }
    }

    async updateWalletWithdrawalSuccessRecords(
        transaction: Transaction,
        transferCode?: string
    ) {
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
                            decrement: transaction.totalAmount,
                        },
                    },
                });
            } else {
                await tx.wallet.update({
                    where: { userId: user.id },
                    data: {
                        commissionBalance: {
                            decrement: transaction.totalAmount,
                        },
                    },
                });
            }
            await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: TransactionStatus.SUCCESS,
                    paymentStatus: PaymentStatus.SUCCESS,
                    serviceTransactionCode: transferCode,
                },
            });
        });
    }

    //Wallet transfer (Benefactor to Beneficiary)
    async transferToOtherWallet(
        options: TransferToOtherWalletDto,
        user: User
    ): Promise<ApiResponse> {
        const beneficiaryWallet = await this.prisma.wallet.findUnique({
            where: { walletNumber: options.walletNumber },
        });

        if (!beneficiaryWallet) {
            throw new WalletNotFoundException(
                `The wallet number, ${options.walletNumber} does not exist`,
                HttpStatus.NOT_FOUND
            );
        }

        const benefactorWallet = await this.prisma.wallet.findUnique({
            where: { userId: user.id },
        });

        if (!benefactorWallet) {
            throw new WalletNotFoundException(
                "Unable to retrieve wallet. Wallet not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (benefactorWallet.mainBalance < options.amount) {
            throw new InsufficientWalletBalanceException(
                "Insufficient wallet balance",
                HttpStatus.BAD_REQUEST
            );
        }

        //DB transaction
        await this.prisma.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { userId: user.id },
                data: {
                    mainBalance: {
                        decrement: options.amount,
                    },
                },
            });
            await tx.wallet.update({
                where: { walletNumber: beneficiaryWallet.walletNumber },
                data: {
                    mainBalance: {
                        increment: options.amount,
                    },
                },
            });

            //generate transaction log
            //beneficiary
            const transactionId = generateId({
                type: "transaction",
            });
            await tx.transaction.create({
                data: {
                    amount: options.amount,
                    flow: TransactionFlow.IN,
                    status: TransactionStatus.SUCCESS,
                    totalAmount: options.amount,
                    transactionId: transactionId,
                    type: TransactionType.WALLET_FUND,
                    receiverId: beneficiaryWallet.userId,
                    userId: beneficiaryWallet.userId,
                    senderId: user.id,
                    walletFundTransactionFlow:
                        WalletFundTransactionFlow.FROM_BENEFACTOR,
                    shortDescription: TransactionShortDescription.WALLET_FUNDED,
                },
            });

            //benefactor
            await tx.transaction.create({
                data: {
                    amount: options.amount,
                    flow: TransactionFlow.OUT,
                    status: TransactionStatus.SUCCESS,
                    totalAmount: options.amount,
                    transactionId: transactionId,
                    type: TransactionType.WALLET_FUND,
                    receiverId: beneficiaryWallet.userId,
                    userId: user.id,
                    senderId: user.id,
                    walletFundTransactionFlow:
                        WalletFundTransactionFlow.TO_BENEFICIARY,
                    shortDescription: TransactionShortDescription.WALLET_FUNDED,
                },
            });
        });

        return buildResponse({
            message: `You have successfully transferred ${options.amount} to wallet number ${beneficiaryWallet.walletNumber}`,
        });
    }

    async verifyWallet(options: VerifyWalletDto) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { walletNumber: options.walletNumber },
            select: {
                walletNumber: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (!wallet) {
            throw new WalletNotFoundException(
                `Wallet number, ${options.walletNumber} does not exist`,
                HttpStatus.NOT_FOUND
            );
        }

        return buildResponse({
            message: "Wallet number successfully verified",
            data: wallet,
        });
    }

    async getWallet(userId: number) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId: userId },
        });

        if (!wallet) {
            throw new WalletNotFoundException(
                "Wallet does not be exist. Kindly verify your KYC information",
                HttpStatus.NOT_FOUND
            );
        }
        return buildResponse({
            message: "Wallet successfully retrieved",
            data: wallet,
        });
    }
}
