import { PrismaService } from "@/modules/core/prisma/services";
import { FormattedElectricDiscoData } from "@/modules/workflow/billPayment/interfaces";
import { IRechargeWorkflowService } from "@/modules/workflow/billPayment/providers/iRecharge/services";
import { ApiResponse, buildResponse, generateId } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    BillProvider,
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
import { PaymentProvider, PurchasePowerDto } from "../dtos";
import {
    BillProviderNotFoundException,
    BuyPowerException,
    DuplicatePowerPurchaseException,
} from "../errors";
import {
    CompletePowerPurchaseOptions,
    ProcessBillPaymentOptions,
    ProviderSlug,
} from "../interfaces";
import logger from "moment-logger";
import { UserNotFoundException } from "../../user";

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

    async initializePowerPurchase(options: PurchasePowerDto, user: User) {
        const provider = await this.prisma.billProvider.findUnique({
            where: { slug: options.billProvider },
        });
        if (!provider) {
            throw new BuyPowerException(
                "Bill provider does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        if (!provider.isActive) {
            throw new BuyPowerException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        switch (options.paymentProvider) {
            case PaymentProvider.PAYSTACK: {
                const reference =
                    await this.handlePowerPurchaseInitializationWithPaystack(
                        options,
                        user,
                        provider
                    );
                return buildResponse({
                    message: "payment reference successfully generated",
                    data: {
                        amount: options.amount,
                        email: user.email,
                        reference: reference,
                    },
                });
            }

            default: {
                throw new BuyPowerException(
                    `Invalid Payment Source must be one of: ${PaymentProvider.PAYSTACK}`,
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    //TODO: complete
    async handlePowerPurchaseInitializationWithPaystack(
        options: PurchasePowerDto,
        user: User,
        provider: BillProvider
    ): Promise<string> {
        const paymentReference = generateId({ type: "reference" });
        const billPaymentReference = generateId({
            type: "numeric",
            length: 12,
        });

        //TODO: compute commission for agent and merchant here

        //record transaction
        const transactionCreateOptions: Prisma.TransactionUncheckedCreateInput =
            {
                amount: options.amount,
                flow: TransactionFlow.OUT,
                status: TransactionStatus.PENDING,
                totalAmount: options.amount,
                transactionId: generateId({ type: "transaction" }),
                type: TransactionType.ELECTRICITY_BILL,
                userId: user.id,
                accountId: options.phone,
                billPaymentReference: billPaymentReference,
                billProviderId: provider.id,
                meterType: options.meterType,
                paymentChannel: PaymentChannel.PAYSTACK_CHANNEL,
                paymentReference: paymentReference,
                paymentStatus: PaymentStatus.PENDING,
                packageType: options.discoType,
                shortDescription:
                    TransactionShortDescription.ELECTRICITY_PAYMENT,
                description: options.narration,
                senderIdentifier: options.discoCode,
                receiverIdentifier: options.meterNumber,
            };

        //iRecharge provider
        if (provider.slug == ProviderSlug.IRECHARGE) {
            const meterInfo = await this.iRechargeWorkflowService.getMeterInfo({
                discoCode: options.discoCode,
                meterNumber: options.meterNumber,
                reference: billPaymentReference,
            });
            transactionCreateOptions.serviceTransactionCode =
                meterInfo.accessToken;

            await this.prisma.transaction.create({
                data: transactionCreateOptions,
            });
        }

        //Ikeja electric
        if (provider.slug == ProviderSlug.IKEJA_ELECTRIC) {
        }

        return paymentReference;
    }

    async processWebhookPowerPurchase(options: ProcessBillPaymentOptions) {
        try {
            const transaction = await this.prisma.transaction.findUnique({
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
            });
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

            const user = await this.prisma.user.findUnique({
                where: { id: transaction.userId },
                select: { email: true, userType: true },
            });
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
                //TODO: For Automation, check for an active provider and switch automatically
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
            logger.error(error);
        }
    }

    async completePowerPurchase(options: CompletePowerPurchaseOptions) {
        switch (options.billProvider.slug) {
            case ProviderSlug.IRECHARGE: {
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
                            paymentStatus: PaymentStatus.SUCCESS,
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

                break;
            }

            default: {
                logger.error(
                    "Failed to complete purchase purchase power. Bill provider slug does not match"
                );
            }
        }
    }
}
