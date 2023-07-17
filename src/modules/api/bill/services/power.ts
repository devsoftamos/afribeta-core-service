import { PrismaService } from "@/modules/core/prisma/services";
import { FormattedElectricDiscoData } from "@/modules/workflow/billPayment/interfaces";
import { IRechargeWorkflowService } from "@/modules/workflow/billPayment/providers/iRecharge/services";
import { ApiResponse, buildResponse, generateId } from "@/utils";
import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
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
import { PurchasePowerDto } from "../dtos/power";
import {
    BillProviderNotFoundException,
    PowerPurchaseException,
    DuplicatePowerPurchaseException,
    PowerPurchaseInitializationHandlerException,
    InvalidBillTypePaymentReference,
} from "../errors";
import {
    BillEventType,
    CompletePowerPurchaseOutput,
    CompletePowerPurchaseTransactionOptions,
    CompleteBillPurchaseUserOptions,
    CustomerMeterInfo,
    BillPurchaseInitializationHandlerOptions,
    PowerPurchaseInitializationHandlerOutput,
    ProcessBillPaymentOptions,
    ProviderSlug,
    CompleteBillPurchaseOptions,
} from "../interfaces";
import logger from "moment-logger";
import { UserNotFoundException } from "../../user";
import {
    WalletNotFoundException,
    InsufficientWalletBalanceException,
} from "../../wallet";
import { IRechargeVendPowerException } from "@/modules/workflow/billPayment/providers/iRecharge";
import { DB_TRANSACTION_TIMEOUT } from "@/config";
import { billEvent } from "../events";
import { PaymentProvider, PaymentReferenceDto } from "../dtos";
import { BillService } from ".";

@Injectable()
export class PowerBillService {
    constructor(
        private iRechargeWorkflowService: IRechargeWorkflowService,
        private prisma: PrismaService,
        @Inject(forwardRef(() => BillService))
        private billService: BillService
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
        options: PurchasePowerDto,
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
            throw new PowerPurchaseException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        const response = (resp: PowerPurchaseInitializationHandlerOutput) => {
            return buildResponse({
                message: "Power payment successfully initialized",
                data: {
                    amount: options.amount,
                    email: user.email,
                    reference: resp.paymentReference,
                    meter: {
                        address: resp.customer.address,
                        minimumAmount: resp.customer.minimumAmount,
                        name: resp.customer.name,
                        util: resp.customer.util,
                        phone: options.phone,
                        meterNumber: options.meterNumber,
                    } as CustomerMeterInfo,
                },
            });
        };

        switch (options.paymentProvider) {
            case PaymentProvider.PAYSTACK: {
                const resp = await this.handlePowerPurchaseInitialization({
                    billProvider: provider,
                    purchaseOptions: options,
                    user: user,
                    paymentChannel: PaymentChannel.PAYSTACK_CHANNEL,
                });
                return response(resp);
            }
            case PaymentProvider.WALLET: {
                const wallet = await this.prisma.wallet.findUnique({
                    where: {
                        userId: user.id,
                    },
                });

                if (!wallet) {
                    throw new WalletNotFoundException(
                        "Wallet does not exist. Kindly setup your KYC",
                        HttpStatus.NOT_FOUND
                    );
                }
                if (wallet.mainBalance < options.amount) {
                    throw new InsufficientWalletBalanceException(
                        "Insufficient wallet balance",
                        HttpStatus.BAD_REQUEST
                    );
                }
                const resp = await this.handlePowerPurchaseInitialization({
                    billProvider: provider,
                    paymentChannel: PaymentChannel.WALLET,
                    purchaseOptions: options,
                    user: user,
                    wallet: wallet,
                });
                return response(resp);
            }

            default: {
                throw new PowerPurchaseException(
                    `Payment provider must be one of: ${PaymentProvider.PAYSTACK}, ${PaymentProvider.WALLET}`,
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    async handlePowerPurchaseInitialization(
        options: BillPurchaseInitializationHandlerOptions<PurchasePowerDto>
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
                        reference: generateId({
                            type: "numeric",
                            length: 12,
                        }),
                    });
                transactionCreateOptions.serviceTransactionCode =
                    meterInfo.accessToken;

                //create/update records
                await this.prisma.transaction.create({
                    data: transactionCreateOptions,
                });

                return {
                    paymentReference: paymentReference,
                    customer: meterInfo.customer,
                };
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
    }

    async processWebhookPowerPurchase(options: ProcessBillPaymentOptions) {
        try {
            const transaction: CompletePowerPurchaseTransactionOptions =
                await this.prisma.transaction.findUnique({
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
                        billPaymentReference: true,
                        paymentChannel: true,
                    },
                });

            if (!transaction) {
                throw new TransactionNotFoundException(
                    "Failed to complete power purchase. Bill Initialization transaction record not found",
                    HttpStatus.NOT_FOUND
                );
            }

            if (transaction.paymentStatus == PaymentStatus.SUCCESS) {
                throw new DuplicatePowerPurchaseException(
                    "Duplicate webhook power payment event",
                    HttpStatus.BAD_REQUEST
                );
            }

            await this.prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    paymentStatus: PaymentStatus.SUCCESS,
                },
            });

            const user: CompleteBillPurchaseUserOptions =
                await this.prisma.user.findUnique({
                    where: { id: transaction.userId },
                    select: { email: true, userType: true },
                });
            if (!user) {
                throw new UserNotFoundException(
                    "Failed to complete power purchase. Customer details does not exist",
                    HttpStatus.NOT_FOUND
                );
            }

            const billProvider = await this.prisma.billProvider.findUnique({
                where: {
                    id: transaction.billProviderId,
                },
            });

            if (!billProvider) {
                //TODO: AUTOMATION UPGRADE, check for an active provider and switch automatically
                throw new BillProviderNotFoundException(
                    "Failed to complete power purchase. Bill provider not found",
                    HttpStatus.NOT_FOUND
                );
            }

            //complete purchase
            await this.completePowerPurchase({
                transaction: transaction,
                user: user,
                billProvider: billProvider,
            });
        } catch (error) {
            logger.error(`POWER_PURCHASE_COMPLETION_WEBHOOK_ERROR: ${error}`);
        }
    }

    async completePowerPurchase(
        options: CompleteBillPurchaseOptions<CompletePowerPurchaseTransactionOptions>
    ): Promise<CompletePowerPurchaseOutput> {
        switch (options.billProvider.slug) {
            case ProviderSlug.IRECHARGE: {
                //TODO: AUTOMATION UPGRADE, if iRecharge service fails, check for an active provider and switch automatically
                const vendPowerResp =
                    await this.iRechargeWorkflowService.vendPower({
                        accessToken: options.transaction.serviceTransactionCode, //access token from get meter info -- irecharge
                        accountId: options.transaction.accountId,
                        amount: options.transaction.amount,
                        discoCode: options.transaction.senderIdentifier,
                        email: options.user.email,
                        meterNumber: options.transaction.receiverIdentifier,
                        referenceId: options.transaction.billPaymentReference,
                    });

                await this.prisma.$transaction(
                    async (tx) => {
                        await tx.transaction.update({
                            where: {
                                id: options.transaction.id,
                            },
                            data: {
                                units: vendPowerResp.units,
                                token: vendPowerResp.meterToken,
                                status: TransactionStatus.SUCCESS,
                                paymentChannel: options.isWalletPayment
                                    ? PaymentChannel.WALLET
                                    : options.transaction.paymentChannel,
                            },
                        });

                        //TODO: for agent and merchant, credit wallet commission balance
                        if (
                            options.user.userType == UserType.MERCHANT ||
                            options.user.userType == UserType.AGENT
                        ) {
                        }
                    },
                    {
                        timeout: DB_TRANSACTION_TIMEOUT,
                    }
                );

                return {
                    meterToken: vendPowerResp.meterToken,
                    units: vendPowerResp.units,
                };
            }

            default: {
                throw new PowerPurchaseException(
                    "Failed to complete power purchase. Invalid bill provider",
                    HttpStatus.NOT_IMPLEMENTED
                );
            }
        }
    }

    async walletPayment(options: PaymentReferenceDto, user: User) {
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

        const transaction = await this.prisma.transaction.findUnique({
            where: {
                paymentReference: options.reference,
            },
        });

        if (!transaction) {
            throw new TransactionNotFoundException(
                "Failed to complete wallet payment for power purchase. Payment reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.type != TransactionType.ELECTRICITY_BILL) {
            throw new InvalidBillTypePaymentReference(
                "Invalid power bill reference",
                HttpStatus.BAD_REQUEST
            );
        }

        if (transaction.paymentStatus == PaymentStatus.SUCCESS) {
            throw new DuplicatePowerPurchaseException(
                "Duplicate power payment",
                HttpStatus.BAD_REQUEST
            );
        }

        if (wallet.mainBalance < transaction.amount) {
            throw new InsufficientWalletBalanceException(
                "Insufficient wallet balance",
                HttpStatus.BAD_REQUEST
            );
        }

        const billProvider = await this.prisma.billProvider.findUnique({
            where: {
                id: transaction.billProviderId,
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

        //record payment
        await this.billService.walletDebitHandler({
            amount: transaction.amount,
            transactionId: transaction.id,
            walletId: wallet.id,
        });

        //purchase
        try {
            const purchaseInfo = await this.completePowerPurchase({
                billProvider: billProvider,
                transaction: transaction,
                user: {
                    email: user.email,
                    userType: user.userType,
                },
                isWalletPayment: true,
            });

            if (purchaseInfo) {
                return buildResponse({
                    message: "Power purchase successful",
                    data: {
                        meter: {
                            units: purchaseInfo.units,
                            token: purchaseInfo.meterToken,
                        },
                        reference: options.reference,
                    },
                });
            } else {
                return buildResponse({
                    message: "Power purchase successful",
                    data: {
                        reference: options.reference,
                    },
                });
            }
        } catch (error) {
            switch (true) {
                case error instanceof IRechargeVendPowerException: {
                    billEvent.emit(BillEventType.BILL_PURCHASE_FAILURE, {
                        transaction,
                        prisma: this.prisma,
                    });
                    throw error;
                }

                default: {
                    throw error;
                }
            }
        }
    }

    async getPowerPurchaseStatus(options: PaymentReferenceDto, user: User) {
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                paymentReference: options.reference,
            },
            select: {
                type: true,
                status: true,
                units: true,
                token: true,
                userId: true,
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
                "Payment reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.type != TransactionType.ELECTRICITY_BILL) {
            throw new InvalidBillTypePaymentReference(
                "Invalid reference type",
                HttpStatus.BAD_REQUEST
            );
        }

        const data = {
            status: transaction.status,
            token: transaction.token,
            units: transaction.units,
        };

        return buildResponse({
            message: "Power purchase status retrieved successfully",
            data: data,
        });
    }
}
