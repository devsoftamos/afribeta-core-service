import {
    AssignDynamicVirtualAccountWithValidationOptions,
    PaystackError,
} from "@/libs/paystack";
import { PrismaService } from "@/modules/core/prisma/services";
import { PaystackService } from "@/modules/workflow/payment/services/paystack";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    Prisma,
    TransactionFlow,
    TransactionStatus,
    TransactionType,
    User,
    WalletFundTransactionFlow,
} from "@prisma/client";
import {
    DuplicateUserException,
    UserNotFoundException,
} from "@/modules/api/user";
import { UserService } from "@/modules/api/user/services";
import { InitiateWalletCreationDto } from "../dto";
import {
    WalletCreationException,
    WalletCreationPaystackException,
    DuplicateWalletException,
    WalletNotFoundException,
    InvalidWalletFundTransactionFlow,
    DuplicateSelfFundWalletTransaction,
} from "../errors";
import {
    CreateWalletAAndVirtualAccount,
    WalletFundHandler,
} from "../interfaces";
import logger from "moment-logger";
import { buildResponse } from "@/utils/api-response-util";
import { isProduction } from "@/config";
import { TransactionService } from "../../transaction/services";
import { TransactionShortDescription } from "../../transaction";

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

    async walletFundHandler(options: WalletFundHandler) {
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
    async handleSelfWalletFund(options: WalletFundHandler) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { paymentReference: options.paymentReference },
        });

        if (transaction) {
            throw new DuplicateSelfFundWalletTransaction(
                "Wallet Fund Transaction already created",
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
            if (options.status == TransactionStatus.SUCCESS) {
                await tx.wallet.update({
                    where: { userId: options.userId },
                    data: {
                        mainBalance: { increment: options.amount },
                    },
                });
            }

            await tx.transaction.create({
                data: {
                    amount: options.amount,
                    userId: options.userId,
                    status: options.status,
                    totalAmount: options.amount,
                    flow: TransactionFlow.IN,
                    type: TransactionType.WALLET_FUND,
                    paymentStatus: options.paymentStatus,
                    paymentChannel: options.paymentChannel,
                    paymentReference: options.paymentReference,
                    transactionId: this.transactionService.generateId(),
                    shortDescription: TransactionShortDescription.WALLET_FUNDED,
                    walletFundTransactionFlow:
                        options.walletFundTransactionFlow,
                } as Prisma.TransactionUncheckedCreateInput,
            });
        });
    }
}
