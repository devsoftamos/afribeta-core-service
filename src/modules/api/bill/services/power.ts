import { PrismaService } from "@/modules/core/prisma/services";
import { FormattedElectricDiscoData } from "@/modules/workflow/billPayment/interfaces";
import { IRechargeWorkflowService } from "@/modules/workflow/billPayment/providers/iRecharge/services";
import { ApiResponse, buildResponse, generateId } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    PaymentChannel,
    PaymentStatus,
    Prisma,
    TransactionFlow,
    TransactionStatus,
    TransactionType,
    User,
    UserType,
} from "@prisma/client";
import {
    TransactionNotFoundException,
    TransactionShortDescription,
} from "../../transaction";
import {
    PaymentProvider,
    PurchasePowerDto,
    PurchasePowerViaExternalPaymentProcessorDto,
} from "../dtos";
import {
    BillProviderNotFoundException,
    PowerPurchaseException,
    DuplicatePowerPurchaseException,
    PowerPurchaseInitializationHandlerException,
} from "../errors";
import {
    CompletePowerPurchaseOptions,
    CompletePowerPurchaseOutput,
    CompletePowerPurchaseTransactionOptions,
    CompletePowerPurchaseUserOptions,
    PowerPurchaseInitializationHandlerOptions,
    PowerPurchaseInitializationHandlerOutput,
    ProcessBillPaymentOptions,
    ProviderSlug,
} from "../interfaces";
import logger from "moment-logger";
import { UserNotFoundException } from "../../user";
import {
    WalletNotFoundException,
    InsufficientWalletBalanceException,
} from "../../wallet";

@Injectable()
export class PowerBillService {
    constructor(
        private iRechargeWorkflowService: IRechargeWorkflowService,
        private prisma: PrismaService
    ) {}

    async getElectricDiscos(): Promise<ApiResponse> {
        let discos: FormattedElectricDiscoData[] = [];
        const providers = await this.prisma.billProvider.findMany({
            where: { isActive: true },
        });

        for (const provider of providers) {
            switch (provider.slug) {
                case ProviderSlug.IRECHARGE: {
                    const iRechargeDiscos =
                        await this.iRechargeWorkflowService.getElectricDiscos(
                            provider.slug
                        );
                    discos = [...discos, ...iRechargeDiscos];
                    break;
                }

                default: {
                    discos = [...discos];
                }
            }
        }

        return buildResponse({
            message: "Electric discos successfully retrieved",
            data: discos,
        });
    }

    async initializePowerPurchase(
        options: PurchasePowerViaExternalPaymentProcessorDto,
        user: User
    ): Promise<ApiResponse> {
        const provider = await this.prisma.billProvider.findUnique({
            where: { slug: options.billProvider },
        });
        if (!provider) {
            throw new PowerPurchaseException(
                "Bill provider does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        if (!provider.isActive) {
            //TODO: AUTOMATION UPGRADE, check for an active provider and switch automatically
            throw new PowerPurchaseException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        switch (options.paymentProvider) {
            case PaymentProvider.PAYSTACK: {
                const resp = await this.handlePowerPurchaseInitialization({
                    billProvider: provider,
                    purchaseOptions: options,
                    user: user,
                    paymentChannel: PaymentChannel.PAYSTACK_CHANNEL,
                });
                return buildResponse({
                    message: "payment reference successfully generated",
                    data: {
                        amount: options.amount,
                        email: user.email,
                        reference: resp.paymentReference,
                    },
                });
            }

            default: {
                throw new PowerPurchaseException(
                    `Payment provider must be one of: ${PaymentProvider.PAYSTACK}`,
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    async handlePowerPurchaseInitialization(
        options: PowerPurchaseInitializationHandlerOptions
    ): Promise<PowerPurchaseInitializationHandlerOutput> {
        const { billProvider, paymentChannel, purchaseOptions, user } = options;

        const paymentReference = generateId({ type: "reference" });
        const billPaymentReference = generateId({
            type: "numeric",
            length: 12,
        });

        //TODO: compute commission for agent and merchant here

        //record transaction
        const transactionCreateOptions: Prisma.TransactionUncheckedCreateInput =
            {
                amount: purchaseOptions.amount,
                flow: TransactionFlow.OUT,
                status: TransactionStatus.PENDING,
                totalAmount: purchaseOptions.amount,
                transactionId: generateId({ type: "transaction" }),
                type: TransactionType.ELECTRICITY_BILL,
                userId: user.id,
                accountId: purchaseOptions.phone,
                billPaymentReference: billPaymentReference,
                billProviderId: billProvider.id,
                meterType: purchaseOptions.meterType,
                paymentChannel: paymentChannel,
                paymentReference: paymentReference,
                paymentStatus: PaymentStatus.PENDING,
                packageType: purchaseOptions.discoType,
                shortDescription:
                    TransactionShortDescription.ELECTRICITY_PAYMENT,
                description: purchaseOptions.narration,
                senderIdentifier: purchaseOptions.discoCode,
                receiverIdentifier: purchaseOptions.meterNumber,
            };

        switch (billProvider.slug) {
            //iRecharge provider
            case ProviderSlug.IRECHARGE: {
                const meterInfo =
                    await this.iRechargeWorkflowService.getMeterInfo({
                        discoCode: purchaseOptions.discoCode,
                        meterNumber: purchaseOptions.meterNumber,
                        reference: billPaymentReference,
                    });
                transactionCreateOptions.serviceTransactionCode =
                    meterInfo.accessToken;

                //create/update records
                await this.prisma.$transaction(async (tx) => {
                    //for wallet payment
                    if (options.wallet) {
                        await tx.wallet.update({
                            where: {
                                id: options.wallet.id,
                            },
                            data: {
                                mainBalance: {
                                    decrement: purchaseOptions.amount,
                                },
                            },
                        });
                        transactionCreateOptions.paymentStatus =
                            PaymentStatus.SUCCESS;
                    }
                    await tx.transaction.create({
                        data: transactionCreateOptions,
                    });
                });
                break;
            }

            //Ikeja Electric
            case ProviderSlug.IKEJA_ELECTRIC: {
                break;
            }

            default: {
                throw new PowerPurchaseInitializationHandlerException(
                    "Third party power vending provider not integrated",
                    HttpStatus.NOT_IMPLEMENTED
                );
            }
        }

        return {
            paymentReference: paymentReference,
        };
    }

    async processWebhookPowerPurchase(options: ProcessBillPaymentOptions) {
        try {
            const transaction = (await this.prisma.transaction.findUnique({
                where: {
                    paymentReference: options.paymentReference,
                },
                select: {
                    id: true,
                    billProviderId: true,
                    serviceTransactionCode: true,
                    userId: true,
                    accountId: true,
                    amount: true,
                    senderIdentifier: true,
                    receiverIdentifier: true,
                    paymentStatus: true,
                    status: true,
                },
            })) as CompletePowerPurchaseTransactionOptions;

            if (!transaction) {
                const error = new TransactionNotFoundException(
                    "Failed to complete power purchase. Bill Initialization transaction record not found",
                    HttpStatus.NOT_FOUND
                );
                return logger.error(error);
            }

            if (transaction.paymentStatus == PaymentStatus.SUCCESS) {
                const error = new DuplicatePowerPurchaseException(
                    "Duplicate webhook power purchase event",
                    HttpStatus.BAD_REQUEST
                );
                return logger.error(error);
            }

            await this.prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    paymentStatus: PaymentStatus.SUCCESS,
                },
            });

            const user = (await this.prisma.user.findUnique({
                where: { id: transaction.userId },
                select: { email: true, userType: true },
            })) as CompletePowerPurchaseUserOptions;
            if (!user) {
                const error = new UserNotFoundException(
                    "Failed to complete power purchase. Customer details does not exist",
                    HttpStatus.NOT_FOUND
                );
                return logger.error(error);
            }

            const billProvider = await this.prisma.billProvider.findUnique({
                where: {
                    id: transaction.billProviderId,
                },
            });

            if (!billProvider) {
                //TODO: AUTOMATION UPGRADE, check for an active provider and switch automatically
                const error = new BillProviderNotFoundException(
                    "Failed to complete power purchase. Bill provider not found",
                    HttpStatus.NOT_FOUND
                );
                return logger.error(error);
            }

            await this.completePowerPurchase({
                transaction: transaction,
                user: user,
                billProvider: billProvider,
            });
        } catch (error) {
            logger.error(`POWER_PURCHASE_COMPLETION_ERROR: ${error}`);
        }
    }

    async completePowerPurchase(
        options: CompletePowerPurchaseOptions
    ): Promise<CompletePowerPurchaseOutput> {
        switch (options.billProvider.slug) {
            case ProviderSlug.IRECHARGE: {
                //TODO: AUTOMATION UPGRADE, if iRecharge service fails, check for an active provider and switch automatically
                const vendPowerResp =
                    await this.iRechargeWorkflowService.vendPower({
                        accessToken: options.transaction.serviceTransactionCode,
                        accountId: options.transaction.accountId,
                        amount: options.transaction.amount,
                        discoCode: options.transaction.senderIdentifier,
                        email: options.user.email,
                        meterNumber: options.transaction.receiverIdentifier,
                        referenceId: generateId({
                            type: "numeric",
                            length: 12,
                        }),
                    });

                await this.prisma.$transaction(async (tx) => {
                    await tx.transaction.update({
                        where: {
                            id: options.transaction.id,
                        },
                        data: {
                            units: vendPowerResp.units,
                            token: vendPowerResp.meterToken,
                            status: TransactionStatus.SUCCESS,
                        },
                    });

                    //TODO: for agent and merchant, credit wallet commission balance
                    if (
                        options.user.userType == UserType.MERCHANT ||
                        options.user.userType == UserType.AGENT
                    ) {
                    }
                });

                return {
                    meterToken: vendPowerResp.meterToken,
                    units: vendPowerResp.meterToken,
                };
            }

            default: {
                logger.error(
                    "Failed to complete purchase purchase power. Bill provider slug does not match"
                );
            }
        }
    }

    //TODO: add controller and test
    async purchasePowerWithWallet(options: PurchasePowerDto, user: User) {
        const wallet = await this.prisma.wallet.findUnique({
            where: {
                userId: user.id,
            },
        });

        if (!wallet) {
            throw new WalletNotFoundException(
                "Wallet not created. Kindly setup your KYC",
                HttpStatus.NOT_FOUND
            );
        }

        if (wallet.mainBalance < options.amount) {
            throw new InsufficientWalletBalanceException(
                "Insufficient wallet balance",
                HttpStatus.BAD_REQUEST
            );
        }

        const billProvider = await this.prisma.billProvider.findUnique({
            where: {
                slug: options.billProvider,
            },
        });

        if (!billProvider) {
            throw new PowerPurchaseException(
                "Bill provider does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        if (!billProvider.isActive) {
            //TODO: AUTOMATION UPGRADE, check for an active provider and switch automatically
            throw new PowerPurchaseException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        //initialize purchase
        const resp = await this.handlePowerPurchaseInitialization({
            billProvider: billProvider,
            paymentChannel: PaymentChannel.WALLET,
            purchaseOptions: options,
            user: user,
            wallet: wallet,
        });

        //complete purchase
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                paymentReference: resp.paymentReference,
            },
        });
        if (!transaction) {
            throw new TransactionNotFoundException(
                "Failed to initialize wallet payment. Please try again",
                HttpStatus.NOT_IMPLEMENTED
            );
        }
        const purchaseInfo = await this.completePowerPurchase({
            billProvider: billProvider,
            transaction: transaction,
            user: {
                email: user.email,
                userType: user.userType,
            },
        });

        if (purchaseInfo) {
            return buildResponse({
                message: "Power purchase successful",
                data: {
                    meter: {
                        units: purchaseInfo.units,
                        token: purchaseInfo.meterToken,
                    },
                    reference: resp.paymentReference,
                },
            });
        } else {
            return buildResponse({
                message: "Power purchase successful",
                data: {
                    reference: resp.paymentReference,
                },
            });
        }
    }
}
