import { AssignDedicatedVirtualAccountWithValidationOptions } from "@/libs/paystack";
import { PrismaService } from "@/modules/core/prisma/services";
import { PaystackService } from "@/modules/workflow/payment/providers/paystack/services";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    NotificationStatus,
    NotificationType,
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
    AuthorizeFundRequestDto,
    AUTHORIZE_WALLET_FUND_REQUEST_TYPE,
    CreateVendorWalletDto,
    FundSubAgentDto,
    FundWalletFromCommissionBalanceDto,
    InitializeWalletFundingDto,
    InitializeWithdrawalDto,
    InitiateWalletCreationDto,
    ListWalletTransactionDto,
    PaymentProvider,
    PaymentReferenceDto,
    PayoutRequestDto,
    RequestWalletFundingDto,
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
    WalletGenericException,
} from "../errors";
import {
    CreateWalletAAndVirtualAccount,
    FundSubAgentHandlerOptions,
    FundSubAgentHandlerResponse,
    PayoutRequestTransaction,
    ProcessWalletFundOptions,
    ProcessWalletWithdrawalOptions,
    VerifySubAgentWalletFundTransaction,
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
    PAYOUT_PERCENT_CHARGE,
    paystackVirtualAccountBank,
} from "@/config";
import { generateId, PaginationMeta } from "@/utils";
import { ProvidusService } from "@/modules/workflow/payment/providers/providus/services";
import { FSDH360BankService } from "@/modules/workflow/payment/providers/fsdh360Bank/services";
import { SquadGTBankService } from "@/modules/workflow/payment/providers/squadGTBank/services";
import { CreateVirtualAccountResponse } from "@/modules/workflow/payment/interfaces";
import { AbilityFactory } from "@/modules/core/ability/services";
import { ForbiddenError, subject } from "@casl/ability";
import { Action } from "@/modules/core/ability/interfaces";
import { InsufficientPermissionException } from "@/modules/core/ability/errors";
import {
    InvalidNotificationTypeException,
    NotificationNotFoundException,
    NotificationGenericException,
} from "../../notification";
import { BankAccountNotFoundException } from "../../bank";

@Injectable()
export class WalletService {
    constructor(
        private prisma: PrismaService,
        private paystackService: PaystackService,
        private userService: UserService,
        private providusService: ProvidusService,
        private fsdh360BankService: FSDH360BankService,
        private squadGTBankService: SquadGTBankService,
        private abilityFactory: AbilityFactory
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
                        isWalletCreated: true,
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

        const paystackDynamicVirtualAccountCreationOptions: AssignDedicatedVirtualAccountWithValidationOptions =
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

        await this.paystackService.assignDedicatedValidatedVirtualAccount(
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
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                paymentReference: options.paymentReference,
            },
            select: {
                id: true,
                paymentStatus: true,
            },
        });

        if (transaction && transaction.paymentStatus == PaymentStatus.SUCCESS) {
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
        options.serviceCharge = options.serviceCharge ?? 0;

        //Handle DB transactions
        await this.prisma.$transaction(
            async (tx) => {
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
                        totalAmount: options.amount + options.serviceCharge,
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
                        serviceCharge: options.serviceCharge, //for banks providing virtual account, the charge is just for reconciliation
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

        const reference = generateId({
            type: "reference",
        });

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
                    reference: reference,
                });
                return buildResponse({
                    message: "Transfer successfully initiated",
                    data: {
                        reference: reference,
                    },
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
        const paymentReference = generateId({ type: "reference" });

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
                    paymentChannel: PaymentChannel.WALLET,
                    paymentStatus: PaymentStatus.SUCCESS,
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
                    paymentReference: paymentReference,
                    paymentStatus: PaymentStatus.SUCCESS,
                    paymentChannel: PaymentChannel.WALLET,
                },
            });
        });

        return buildResponse({
            message: `You have successfully transferred ${options.amount} to wallet number ${beneficiaryWallet.walletNumber}`,
            data: {
                reference: paymentReference,
            },
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
        console.log(user.id);
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

        // let accountName = user.createdById
        //     ? `${user.firstName} ${user.lastName}`
        //     : `${user.businessName}`;
        const accountName = `${user.firstName} ${user.lastName}`;

        // if (accountName.trim().split(" ").length < 2) {
        //     accountName = `${accountName} ${accountName}`;
        // }

        const providusAccountDetail = await this.providusService
            .createVirtualAccount({
                accountName: accountName,
                bvn: options.bvn,
            })
            .catch(() => false);

        const fsdh360BankAccountDetail = await this.fsdh360BankService
            .createVirtualAccount({
                accountName: accountName,
                bvn: options.bvn,
            })
            .catch(() => false);

        const squadGTBankAccountDetail = await this.squadGTBankService
            .createVirtualAccount({
                accountName: accountName,
                bvn: options.bvn,
                phone: user.phone,
                userIdentifier: user.identifier,
            })
            .catch(() => false);

        const virtualAccountCreateManyOptions: Prisma.Enumerable<Prisma.VirtualBankAccountCreateManyInput> =
            [];

        if (providusAccountDetail) {
            const account =
                providusAccountDetail as CreateVirtualAccountResponse;
            const providusCreateOptions: Prisma.VirtualBankAccountUncheckedCreateInput =
                {
                    accountName: account.accountName,
                    accountNumber: account.accountNumber,
                    bankName: this.providusService.bankDetails.name,
                    provider: VirtualAccountProvider.PROVIDUS,
                    userId: user.id,
                    slug: this.providusService.bankDetails.slug,
                };
            virtualAccountCreateManyOptions.push(providusCreateOptions);
        }
        if (fsdh360BankAccountDetail) {
            const account =
                fsdh360BankAccountDetail as CreateVirtualAccountResponse;
            const fsdhCreateOptions: Prisma.VirtualBankAccountUncheckedCreateInput =
                {
                    accountName: account.accountName,
                    accountNumber: account.accountNumber,
                    bankName: this.fsdh360BankService.bankDetails.name,
                    provider: VirtualAccountProvider.FSDH360,
                    userId: user.id,
                    slug: this.fsdh360BankService.bankDetails.slug,
                };
            virtualAccountCreateManyOptions.push(fsdhCreateOptions);
        }
        if (squadGTBankAccountDetail) {
            const account =
                squadGTBankAccountDetail as CreateVirtualAccountResponse;
            const gtBankCreateOptions: Prisma.VirtualBankAccountUncheckedCreateInput =
                {
                    accountName: account.accountName,
                    accountNumber: account.accountNumber,
                    bankName: this.squadGTBankService.bankDetails.name,
                    provider: VirtualAccountProvider.GTBANK,
                    userId: user.id,
                    slug: this.squadGTBankService.bankDetails.slug,
                };
            virtualAccountCreateManyOptions.push(gtBankCreateOptions);
        }

        //create record
        const userUpdateData: Prisma.UserUpdateInput = {
            isWalletCreated: true,
        };

        if (virtualAccountCreateManyOptions.length) {
            const walletNumber = customAlphabet("1234567890ABCDEFGH", 10)();
            await this.prisma
                .$transaction(async (tx) => {
                    await tx.wallet.create({
                        data: { userId: user.id, walletNumber: walletNumber },
                    });

                    await tx.virtualBankAccount.createMany({
                        data: virtualAccountCreateManyOptions,
                    });
                    await tx.user.update({
                        where: {
                            id: user.id,
                        },
                        data: userUpdateData,
                    });
                })
                .catch((err) => {
                    throw new WalletCreationException(
                        err.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                });
        } else {
            throw new WalletCreationException(
                "Wallet creation failed",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

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

        return buildResponse({
            message: "Wallet transactions successfully retrieved",
            data: {
                credit: credit,
                debit: debit,
                meta: meta,
                records: transactions,
            },
        });
    }

    async fundSubAgent(options: FundSubAgentDto, user: User) {
        const resp = await this.fundSubAgentHandler(options, user);
        return buildResponse({
            message: "Wallet funding successful",
            data: {
                reference: resp.paymentReference,
            },
        });
    }

    async fundSubAgentHandler(
        options: FundSubAgentHandlerOptions,
        user: User
    ): Promise<FundSubAgentHandlerResponse> {
        const agent = await this.prisma.user.findUnique({
            where: {
                id: options.agentId,
            },
        });

        if (!agent) {
            throw new UserNotFoundException(
                "Agent account not found",
                HttpStatus.NOT_FOUND
            );
        }

        try {
            const ability = await this.abilityFactory.createForUser(user);
            ForbiddenError.from(ability).throwUnlessCan(
                Action.FundAgent,
                subject("User", { createdById: agent.createdById } as any)
            );
        } catch (error) {
            throw new InsufficientPermissionException(
                error.message,
                HttpStatus.FORBIDDEN
            );
        }

        const [merchantWallet, agentWallet] = await Promise.all([
            this.prisma.wallet.findUnique({
                where: {
                    userId: user.id,
                },
            }),
            this.prisma.wallet.findUnique({
                where: {
                    userId: options.agentId,
                },
            }),
        ]);

        if (!merchantWallet) {
            throw new WalletNotFoundException(
                "Failed to fund agent. Wallet not found. Kindly setup your wallet",
                HttpStatus.NOT_FOUND
            );
        }

        if (!agentWallet) {
            throw new WalletNotFoundException(
                "Failed to fund agent. Agent Wallet not found. Kindly setup your agent wallet",
                HttpStatus.NOT_FOUND
            );
        }

        if (merchantWallet.mainBalance < options.amount) {
            throw new InsufficientWalletBalanceException(
                "Insufficient wallet balance",
                HttpStatus.BAD_REQUEST
            );
        }

        const paymentReference = generateId({ type: "reference" });
        await this.prisma.$transaction(
            async (tx) => {
                await tx.wallet.update({
                    where: {
                        id: merchantWallet.id,
                    },
                    data: {
                        mainBalance: {
                            decrement: options.amount,
                        },
                    },
                });
                await tx.wallet.update({
                    where: {
                        id: agentWallet.id,
                    },
                    data: {
                        mainBalance: {
                            increment: options.amount,
                        },
                    },
                });

                const transactionId = generateId({ type: "transaction" });

                //agent
                await tx.transaction.create({
                    data: {
                        amount: options.amount,
                        flow: TransactionFlow.IN,
                        status: TransactionStatus.SUCCESS,
                        totalAmount: options.amount,
                        transactionId: transactionId,
                        type: TransactionType.WALLET_FUND,
                        receiverId: options.agentId,
                        userId: options.agentId,
                        senderId: user.id,
                        walletFundTransactionFlow:
                            WalletFundTransactionFlow.FROM_MERCHANT,
                        shortDescription:
                            TransactionShortDescription.WALLET_FUNDED,
                        paymentChannel: PaymentChannel.WALLET,
                        paymentStatus: PaymentStatus.SUCCESS,
                    },
                });

                //merchant
                await tx.transaction.create({
                    data: {
                        amount: options.amount,
                        flow: TransactionFlow.OUT,
                        status: TransactionStatus.SUCCESS,
                        totalAmount: options.amount,
                        transactionId: transactionId,
                        type: TransactionType.WALLET_FUND,
                        receiverId: options.agentId,
                        userId: user.id,
                        senderId: user.id,
                        walletFundTransactionFlow:
                            WalletFundTransactionFlow.TO_AGENT,
                        shortDescription:
                            TransactionShortDescription.WALLET_FUNDED,
                        paymentReference: paymentReference,
                        paymentStatus: PaymentStatus.SUCCESS,
                        paymentChannel: PaymentChannel.WALLET,
                    },
                });

                //notification record update
                if (options.notificationRecord) {
                    await tx.notification.update({
                        where: {
                            id: options.notificationRecord.id,
                        },
                        data: {
                            status: NotificationStatus.APPROVED,
                        },
                    });
                }
            },
            {
                timeout: DB_TRANSACTION_TIMEOUT,
            }
        );
        return {
            paymentReference: paymentReference,
        };
    }

    async verifySubAgentFunding(options: PaymentReferenceDto, user: User) {
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
            !(
                transaction.type == TransactionType.WALLET_FUND &&
                transaction.walletFundTransactionFlow ==
                    WalletFundTransactionFlow.TO_AGENT
            )
        ) {
            throw new TransactionTypeException(
                "Invalid reference type",
                HttpStatus.BAD_REQUEST
            );
        }

        const data: VerifySubAgentWalletFundTransaction = {
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
                businessName: user.businessName,
            },
            agent: {
                firstName: transaction.receiver.firstName,
                lastName: transaction.receiver.lastName,
                walletNumber: transaction.receiver.wallet.walletNumber,
            },
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
        };

        return buildResponse({
            message: "Agent Wallet fund transaction successfully verified",
            data: data,
        });
    }

    async requestWalletFunding(options: RequestWalletFundingDto, user: User) {
        const merchant = await this.prisma.user.findUnique({
            where: {
                id: user.createdById,
            },
        });

        if (!merchant) {
            throw new UserNotFoundException(
                "Merchant account not found",
                HttpStatus.NOT_FOUND
            );
        }

        await this.prisma.notification.create({
            data: {
                userId: merchant.id,
                agentId: user.id,
                amount: options.amount,
                status: NotificationStatus.PENDING,
                type: NotificationType.WALLET_FUND_REQUEST,
            },
        });

        return buildResponse({
            message: "Fund request successfully sent",
        });
    }

    async authorizeFundRequest(options: AuthorizeFundRequestDto, user: User) {
        const notification = await this.prisma.notification.findUnique({
            where: {
                id: options.notificationId,
            },
        });

        if (!notification || notification.userId != user.id) {
            throw new NotificationNotFoundException(
                "Failed to authorize fund request. Request not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (notification.type != NotificationType.WALLET_FUND_REQUEST) {
            throw new InvalidNotificationTypeException(
                "Invalid notification type",
                HttpStatus.BAD_REQUEST
            );
        }

        if (notification.status != NotificationStatus.PENDING) {
            throw new NotificationGenericException(
                "Request already authorized",
                HttpStatus.BAD_REQUEST
            );
        }

        const declineFundWalletRequestHandler = async () => {
            await this.prisma.notification.update({
                where: {
                    id: notification.id,
                },
                data: {
                    status: NotificationStatus.DECLINED,
                },
            });

            return buildResponse({
                message: "Request successfully declined",
            });
        };

        switch (options.authorizeType) {
            case AUTHORIZE_WALLET_FUND_REQUEST_TYPE.DECLINE: {
                return await declineFundWalletRequestHandler();
            }
            case AUTHORIZE_WALLET_FUND_REQUEST_TYPE.APPROVE: {
                const resp = await this.fundSubAgentHandler(
                    {
                        agentId: notification.agentId,
                        amount: notification.amount,
                        notificationRecord: notification,
                    },
                    user
                );
                return buildResponse({
                    message: "Request successfully approved",
                    data: {
                        reference: resp.paymentReference,
                    },
                });
            }

            default: {
                throw new WalletGenericException(
                    "Invalid wallet fund request authorize type",
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    async fundWalletFromCommissionBalance(
        options: FundWalletFromCommissionBalanceDto,
        user: User
    ) {
        const wallet = await this.prisma.wallet.findUnique({
            where: {
                userId: user.id,
            },
        });

        if (!wallet) {
            throw new WalletNotFoundException(
                "Wallet not found. Kindly activate your wallet",
                HttpStatus.NOT_FOUND
            );
        }

        if (wallet.commissionBalance < options.amount) {
            throw new InsufficientWalletBalanceException(
                "Insufficient commission balance",
                HttpStatus.BAD_REQUEST
            );
        }

        const paymentReference = generateId({ type: "reference" });
        const transactionId = generateId({ type: "transaction" });
        await this.prisma.$transaction(
            async (tx) => {
                await tx.wallet.update({
                    where: {
                        id: wallet.id,
                    },
                    data: {
                        commissionBalance: {
                            decrement: options.amount,
                        },
                        mainBalance: {
                            increment: options.amount,
                        },
                    },
                });

                await tx.transaction.create({
                    data: {
                        amount: options.amount,
                        flow: TransactionFlow.IN,
                        status: TransactionStatus.SUCCESS,
                        totalAmount: options.amount,
                        transactionId: transactionId,
                        type: TransactionType.WALLET_FUND,
                        receiverId: user.id,
                        userId: user.id,
                        senderId: user.id,
                        walletFundTransactionFlow:
                            WalletFundTransactionFlow.COMMISSION_BALANCE_TO_MAIN_BALANCE,
                        shortDescription:
                            TransactionShortDescription.WALLET_FUNDED,
                        paymentReference: paymentReference,
                        paymentStatus: PaymentStatus.SUCCESS,
                        paymentChannel: PaymentChannel.WALLET,
                    },
                });
            },
            {
                timeout: DB_TRANSACTION_TIMEOUT,
            }
        );

        return buildResponse({
            message: "Main wallet successfully funded",
        });
    }

    async payoutRequest(options: PayoutRequestDto, user: User) {
        const [wallet, bankAccount] = await Promise.all([
            this.prisma.wallet.findUnique({
                where: {
                    userId: user.id,
                },
            }),
            this.prisma.bankAccount.findUnique({
                where: {
                    userId: user.id,
                },
            }),
        ]);

        if (!wallet) {
            throw new WalletNotFoundException(
                "Wallet not found. Kindly activate your wallet",
                HttpStatus.NOT_FOUND
            );
        }

        if (wallet.commissionBalance < options.amount) {
            throw new InsufficientWalletBalanceException(
                "Insufficient commission balance",
                HttpStatus.BAD_REQUEST
            );
        }

        if (!bankAccount) {
            throw new BankAccountNotFoundException(
                "Bank account not found. Kindly add a bank account to receive payment",
                HttpStatus.NOT_FOUND
            );
        }

        const serviceCharge = parseFloat(
            ((PAYOUT_PERCENT_CHARGE / 100) * options.amount).toFixed(2)
        );
        const payableAmount = options.amount - serviceCharge;
        const paymentReference = generateId({ type: "reference" });

        await this.prisma.$transaction(
            async (tx) => {
                await tx.wallet.update({
                    where: {
                        userId: user.id,
                    },
                    data: {
                        commissionBalance: {
                            decrement: options.amount,
                        },
                    },
                });

                await tx.transaction.create({
                    data: {
                        amount: payableAmount,
                        flow: TransactionFlow.OUT,
                        status: TransactionStatus.PENDING,
                        totalAmount: options.amount,
                        transactionId: generateId({ type: "transaction" }),
                        type: TransactionType.PAYOUT,
                        paymentChannel: PaymentChannel.MANUAL,
                        paymentReference: paymentReference,
                        serviceCharge: serviceCharge,
                        userId: user.id,
                        shortDescription: TransactionShortDescription.PAYOUT,
                        paymentStatus: PaymentStatus.PENDING,
                    },
                });
            },
            {
                timeout: DB_TRANSACTION_TIMEOUT,
            }
        );

        return buildResponse({
            message: "payout request successfully sent",
            data: {
                reference: paymentReference,
            },
        });
    }

    async verifyPayoutRequest(options: PaymentReferenceDto, user: User) {
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
                totalAmount: true,
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

        if (transaction.type != TransactionType.PAYOUT) {
            throw new TransactionTypeException(
                "Invalid reference type",
                HttpStatus.BAD_REQUEST
            );
        }

        const data: PayoutRequestTransaction = {
            status: transaction.status,
            paymentStatus: transaction.paymentStatus,
            amount: transaction.amount,
            serviceCharge: transaction.serviceCharge,
            totalAmount: transaction.totalAmount,
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
            message: "Payout request transaction successfully verified",
            data: data,
        });
    }
}
