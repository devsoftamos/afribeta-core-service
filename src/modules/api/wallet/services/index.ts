import { AssignDynamicVirtualAccountWithValidationOptions } from "@/libs/paystack";
import { PrismaService } from "@/modules/core/prisma/services";
import { PaystackService } from "@/modules/workflow/payment/providers/paystack/services";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    PaymentChannel,
    PaymentStatus,
    Prisma,
    Transaction,
    TransactionFlow,
    TransactionStatus,
    TransactionType,
    User,
    UserType,
    VirtualAccountProvider,
    WalletFundTransactionFlow,
} from "@prisma/client";
import { UserNotFoundException } from "@/modules/api/user";
import { UserService } from "@/modules/api/user/services";
import {
    CreateVendorWalletDto,
    InitializeWalletFundingDto,
    InitializeWithdrawalDto,
    InitiateWalletCreationDto,
    ListWalletTransactionDto,
    PaymentProvider,
    PaymentReferenceDto,
    TransferToOtherWalletDto,
    VerifyWalletDto,
} from "../dto";
import {
    WalletCreationException,
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
    VerifyWalletToBankTransferTransaction,
    VerifyWalletToWalletTransferTransaction,
    VerifyWalletTransaction,
    WalletFundProvider,
} from "../interfaces";
import logger from "moment-logger";
import {
    ApiResponse,
    buildResponse,
    DataWithPagination,
} from "@/utils/api-response-util";
import {
    TransactionNotFoundException,
    TransactionShortDescription,
    TransactionTypeException,
} from "../../transaction";
import { customAlphabet } from "nanoid";
import {
    AFRIBETA_WALLET_NAME,
    DB_TRANSACTION_TIMEOUT,
    paystackVirtualAccountBank,
} from "@/config";
import { generateId, PaginationMeta } from "@/utils";
import { ProvidusService } from "@/modules/workflow/payment/providers/providus/services";

@Injectable()
export class WalletService {
    constructor(
        private prisma: PrismaService,
        private paystackService: PaystackService,
        private userService: UserService,
        private providusService: ProvidusService
    ) {}

    async processWebhookWalletAndVirtualAccountCreation(
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
                await tx.user.update({
                    where: {
                        id: user.id,
                    },
                    data: {
                        isKycVerified: true,
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
                preferred_bank:
                    paystackVirtualAccountBank ?? ("wema-bank" as any),
            };

        await this.paystackService.assignDynamicValidatedVirtualAccount(
            paystackDynamicVirtualAccountCreationOptions
        );
        return buildResponse({
            message:
                "Your Afribeta wallet would be created after we have successfully verified your bank details",
        });
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
        await this.prisma.$transaction(
            async (tx) => {
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
                        shortDescription:
                            TransactionShortDescription.WALLET_FUNDED,
                        walletFundTransactionFlow:
                            options.walletFundTransactionFlow,
                        provider: options.provider,
                    },
                });
            },
            {
                timeout: DB_TRANSACTION_TIMEOUT,
            }
        );
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
                provider: WalletFundProvider.PAYSTACK, //currently default to paystack
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
                    userType: user.userType,
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
                "Failed to update transaction record. Transaction Reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (
            transaction.status == TransactionStatus.SUCCESS ||
            transaction.status == TransactionStatus.FAILED
        ) {
            throw new DuplicateWalletWithdrawalTransaction(
                "Wallet withdrawal transaction already completed",
                HttpStatus.BAD_REQUEST
            );
        }

        const user = await this.prisma.user.findUnique({
            where: { id: transaction.userId },
        });

        if (!user) {
            throw new UserNotFoundException(
                "Failed to update transaction record. User not found",
                HttpStatus.NOT_FOUND
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
                const totalAmount =
                    transaction.amount + transaction.serviceCharge;
                await this.prisma.$transaction(async (tx) => {
                    await tx.transaction.update({
                        where: { id: transaction.id },
                        data: {
                            paymentStatus: PaymentStatus.FAILED,
                            status: TransactionStatus.FAILED,
                            serviceTransactionCode: options.transferCode,
                        },
                    });
                    if (user.userType == UserType.CUSTOMER) {
                        await tx.wallet.update({
                            where: { userId: transaction.userId },
                            data: {
                                mainBalance: {
                                    increment: totalAmount,
                                },
                            },
                        });
                    } else {
                        await tx.wallet.update({
                            where: { userId: transaction.userId },
                            data: {
                                commissionBalance: {
                                    increment: totalAmount,
                                },
                            },
                        });
                    }
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
        await this.prisma.$transaction(async (tx) => {
            await tx.transaction.update({
                where: { id: transaction.id },
                data: {
                    status: TransactionStatus.SUCCESS,
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
            const paymentReference = generateId({ type: "reference" });
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
                    paymentReference: paymentReference,
                    paymentStatus: PaymentStatus.SUCCESS,
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

    async createVendorWallet(
        options: CreateVendorWalletDto,
        user: User
    ): Promise<ApiResponse> {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId: user.id },
        });

        if (wallet) {
            throw new DuplicateWalletException(
                "Wallet already exists",
                HttpStatus.BAD_REQUEST
            );
        }

        const vendorTypes = [UserType.MERCHANT, UserType.AGENT];
        if (!vendorTypes.includes(user.userType as any)) {
            throw new WalletCreationException(
                "User must be an agent or merchant",
                HttpStatus.BAD_REQUEST
            );
        }

        const accountDetail = await this.providusService.createVirtualAccount({
            accountName: `${user.firstName} ${user.lastName}`,
            bvn: options.bvn,
        });

        if (!accountDetail) {
            throw new WalletCreationException(
                "Failed to create wallet. Kindly try again",
                HttpStatus.NOT_IMPLEMENTED
            );
        }

        //create record
        const walletNumber = customAlphabet("1234567890ABCDEFGH", 10)();
        await this.prisma
            .$transaction(async (tx) => {
                await tx.wallet.create({
                    data: { userId: user.id, walletNumber: walletNumber },
                });

                await tx.virtualBankAccount.create({
                    data: {
                        accountName: accountDetail.accountName,
                        accountNumber: accountDetail.accountNumber,
                        bankName: "Providus",
                        provider: VirtualAccountProvider.PROVIDUS,
                        userId: user.id,
                        slug: "providus",
                    },
                });
            })
            .catch((err) => {
                throw new WalletCreationException(
                    err.message,
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            });

        return buildResponse({
            message: "Wallet successfully created",
        });
    }

    async verifySelfWalletFunding(options: PaymentReferenceDto, user: User) {
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                paymentReference: options.reference,
            },
            select: {
                type: true,
                status: true,
                userId: true,
                paymentReference: true,
                amount: true,
                paymentChannel: true,
                paymentStatus: true,
                serviceCharge: true,
                createdAt: true,
                updatedAt: true,
                transactionId: true,
                receiverIdentifier: true,
                flow: true,
                walletFundTransactionFlow: true,
            },
        });

        if (!transaction) {
            throw new TransactionNotFoundException(
                "Payment reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.userId != user.id) {
            throw new TransactionNotFoundException(
                "Reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (
            transaction.type != TransactionType.WALLET_FUND ||
            transaction.walletFundTransactionFlow !=
                WalletFundTransactionFlow.SELF_FUND
        ) {
            throw new TransactionTypeException(
                "Invalid reference type",
                HttpStatus.BAD_REQUEST
            );
        }

        const data: VerifyWalletTransaction = {
            status: transaction.status,
            paymentStatus: transaction.paymentStatus,
            amount: transaction.amount,
            serviceCharge: transaction.serviceCharge,
            flow: transaction.flow,
            reference: transaction.paymentReference,
            transactionId: transaction.transactionId,
            type: transaction.type,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
            },
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
        };

        return buildResponse({
            message: "Wallet fund transaction successfully verified",
            data: data,
        });
    }

    async verifyWalletToBankTransfer(options: PaymentReferenceDto, user: User) {
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                paymentReference: options.reference,
            },
            select: {
                type: true,
                status: true,
                userId: true,
                paymentReference: true,
                amount: true,
                paymentChannel: true,
                paymentStatus: true,
                serviceCharge: true,
                createdAt: true,
                updatedAt: true,
                transactionId: true,
                receiverIdentifier: true,
                flow: true,
                destinationBankAccountName: true,
                destinationBankAccountNumber: true,
                destinationBankName: true,
            },
        });

        if (!transaction) {
            throw new TransactionNotFoundException(
                "Payment reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.userId != user.id) {
            throw new TransactionNotFoundException(
                "Reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.type != TransactionType.TRANSFER_FUND) {
            throw new TransactionTypeException(
                "Invalid reference type",
                HttpStatus.BAD_REQUEST
            );
        }

        const data: VerifyWalletToBankTransferTransaction = {
            status: transaction.status,
            paymentStatus: transaction.paymentStatus,
            amount: transaction.amount,
            serviceCharge: transaction.serviceCharge,
            flow: transaction.flow,
            reference: transaction.paymentReference,
            transactionId: transaction.transactionId,
            receiver: {
                destinationBankAccountNumber:
                    transaction.destinationBankAccountNumber,
                destinationBankAccountName:
                    transaction.destinationBankAccountName,
                destinationBankName: transaction.destinationBankName,
            },
            type: transaction.type,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
            },
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
        };

        return buildResponse({
            message: "Bank transfer transaction successfully verified",
            data: data,
        });
    }

    async verifyWalletToWalletTransfer(
        options: PaymentReferenceDto,
        user: User
    ) {
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                paymentReference: options.reference,
            },
            select: {
                type: true,
                status: true,
                userId: true,
                paymentReference: true,
                amount: true,
                paymentChannel: true,
                paymentStatus: true,
                serviceCharge: true,
                createdAt: true,
                updatedAt: true,
                transactionId: true,
                walletFundTransactionFlow: true,
                flow: true,
                receiver: {
                    select: {
                        firstName: true,
                        lastName: true,
                        wallet: {
                            select: {
                                walletNumber: true,
                            },
                        },
                    },
                },
            },
        });

        if (!transaction) {
            throw new TransactionNotFoundException(
                "Payment reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.userId != user.id) {
            throw new TransactionNotFoundException(
                "Reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (
            transaction.type != TransactionType.WALLET_FUND ||
            transaction.walletFundTransactionFlow !=
                WalletFundTransactionFlow.TO_BENEFICIARY
        ) {
            throw new TransactionTypeException(
                "Invalid reference type",
                HttpStatus.BAD_REQUEST
            );
        }

        const data: VerifyWalletToWalletTransferTransaction = {
            status: transaction.status,
            paymentStatus: transaction.paymentStatus,
            amount: transaction.amount,
            serviceCharge: transaction.serviceCharge,
            flow: transaction.flow,
            reference: transaction.paymentReference,
            transactionId: transaction.transactionId,
            receiver: {
                walletNumber: transaction.receiver?.wallet?.walletNumber,
                name: `${transaction.receiver?.firstName} ${transaction.receiver?.lastName}`,
                bankName: AFRIBETA_WALLET_NAME,
            },
            type: transaction.type,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
            },
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
        };

        return buildResponse({
            message: "Wallet transfer transaction successfully verified",
            data: data,
        });
    }

    async listWalletTransactions(
        options: ListWalletTransactionDto,
        user: User
    ): Promise<ApiResponse<DataWithPagination>> {
        const meta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                userId: user.id,
                status: TransactionStatus.SUCCESS,
                OR: [
                    {
                        type: {
                            in: [
                                TransactionType.TRANSFER_FUND,
                                TransactionType.WALLET_FUND,
                            ],
                        },
                    },
                    {
                        paymentChannel: PaymentChannel.WALLET,
                    },
                ],
            },
            select: {
                id: true,
                amount: true,
                flow: true,
                shortDescription: true,
                createdAt: true,
                updatedAt: true,
            },
        };

        if (options.startDate && options.endDate) {
            queryOptions.where = {
                ...queryOptions.where,
                createdAt: {
                    gte: new Date(options.startDate),
                    lte: new Date(options.endDate),
                },
            };
        }

        if (options.pagination) {
            const page = +options.page ?? 1;
            const limit = +options.limit ?? 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.transaction.count({
                where: queryOptions.where,
            });
            meta.totalCount = count;
            meta.page = page;
            meta.perPage = limit;
        }

        const transactions = await this.prisma.transaction.findMany(
            queryOptions
        );
        if (options.pagination) {
            meta.pageCount = transactions.length;
        }
        const trans = await this.prisma.transaction.findMany({
            where: queryOptions.where,
            select: {
                amount: true,
                flow: true,
            },
        });

        const credit = trans
            .filter((trans) => trans.flow == TransactionFlow.IN)
            .reduce((acc, hash) => acc + hash.amount, 0);

        const debit = trans
            .filter((trans) => trans.flow == TransactionFlow.OUT)
            .reduce((acc, hash) => acc + hash.amount, 0);

        return buildResponse<DataWithPagination>({
            message: "Wallet transactions successfully retrieved",
            data: {
                credit: credit,
                debit: debit,
                meta: meta,
                records: transactions,
            },
        });
    }
}
