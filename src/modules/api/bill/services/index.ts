import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
    BillType,
    MeterAccountType,
    PaymentChannel,
    PaymentStatus,
    Prisma,
    TransactionFlow,
    TransactionStatus,
    TransactionType,
    User,
    UserType,
    WalletFundTransactionFlow,
} from "@prisma/client";
import {
    BillPaymentFailure,
    BillPurchaseFailure,
    ComputeTypes,
    ComputeCommissionOptions,
    ComputeCommissionResult,
    ProcessBillPaymentOptions,
    WalletChargeHandler,
    BillServiceSlug,
    CheckServiceChargeOptions,
    BillProviderSlugForPower,
} from "../interfaces";
import logger from "moment-logger";
import { PowerBillService } from "./power";
import { DataBillService } from "./data";
import { PrismaService } from "@/modules/core/prisma/services";
import {
    AGENT_MD_METER_COMMISSION_CAP_AMOUNT,
    DB_TRANSACTION_TIMEOUT,
    AGENT_MD_METER_COMMISSION_PERCENT,
    SUBAGENT_MD_METER_COMMISSION_PERCENT,
    DEFAULT_CAPPING_MULTIPLIER,
} from "@/config";
import {
    BillPaymentValidationException,
    BillProviderNotFoundException,
    ComputeBillCommissionException,
    InvalidBillProviderException,
    PayBillCommissionException,
    WalletChargeException,
} from "../errors";
import { AirtimeBillService } from "./airtime";
import { InternetBillService } from "./internet";
import { CableTVBillService } from "./cabletv";
import {
    BillProviderEnum,
    PaginationDto,
    UpdateDefaultBillProviderDto,
} from "../dtos";
import {
    ApiResponse,
    buildResponse,
    generateId,
    PaginationMeta,
} from "@/utils";
import {
    TransactionNotFoundException,
    TransactionShortDescription,
} from "../../transaction";
import { InsufficientWalletBalanceException } from "../../wallet";

@Injectable()
export class BillService {
    constructor(
        @Inject(forwardRef(() => PowerBillService))
        private powerBillService: PowerBillService,

        @Inject(forwardRef(() => DataBillService))
        private dataBillService: DataBillService,

        @Inject(forwardRef(() => AirtimeBillService))
        private airtimeBillService: AirtimeBillService,

        @Inject(forwardRef(() => InternetBillService))
        private internetBillService: InternetBillService,

        @Inject(forwardRef(() => CableTVBillService))
        private cableTVBillService: CableTVBillService,

        private prisma: PrismaService
    ) {}

    async handleWebhookSuccessfulBillPayment(
        options: ProcessBillPaymentOptions
    ) {
        switch (options.billType) {
            case TransactionType.ELECTRICITY_BILL: {
                await this.powerBillService.processWebhookPowerPurchase({
                    billType: options.billType,
                    paymentReference: options.paymentReference,
                });
                break;
            }
            case TransactionType.DATA_PURCHASE: {
                await this.dataBillService.processWebhookDataPurchase({
                    billType: options.billType,
                    paymentReference: options.paymentReference,
                });
                break;
            }

            case TransactionType.AIRTIME_PURCHASE: {
                await this.airtimeBillService.processWebhookAirtimePurchase({
                    billType: options.billType,
                    paymentReference: options.paymentReference,
                });
                break;
            }

            case TransactionType.INTERNET_BILL: {
                await this.internetBillService.processWebhookInternetPurchase({
                    billType: options.billType,
                    paymentReference: options.paymentReference,
                });
                break;
            }

            case TransactionType.CABLETV_BILL: {
                await this.cableTVBillService.processWebhookCableTVPurchase({
                    billType: options.billType,
                    paymentReference: options.paymentReference,
                });
                break;
            }

            default: {
                logger.error(
                    "Failed to complete bill purchase. Invalid bill type"
                );
            }
        }
    }

    async walletChargeHandler(options: WalletChargeHandler) {
        try {
            await this.prisma.$transaction(
                async (tx) => {
                    const wallet = await tx.wallet.update({
                        where: {
                            id: options.walletId,
                        },
                        data: {
                            mainBalance: {
                                decrement: options.amount,
                            },
                        },
                    });

                    if (wallet.mainBalance < 0) {
                        throw new InsufficientWalletBalanceException(
                            "Insufficient wallet balance",
                            HttpStatus.BAD_REQUEST
                        );
                    }

                    await tx.transaction.update({
                        where: {
                            id: options.transactionId,
                        },
                        data: {
                            paymentStatus: PaymentStatus.SUCCESS,
                        },
                    });
                },
                {
                    timeout: DB_TRANSACTION_TIMEOUT,
                    isolationLevel:
                        Prisma.TransactionIsolationLevel.Serializable,
                }
            );
        } catch (error) {
            switch (true) {
                case error instanceof InsufficientWalletBalanceException: {
                    throw error;
                }

                default: {
                    throw new WalletChargeException(
                        "Failed to complete wallet charge",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    async paymentFailureHandler(options: BillPaymentFailure) {
        try {
            await this.prisma.transaction.update({
                where: {
                    id: options.transactionId,
                },
                data: {
                    status: TransactionStatus.FAILED,
                    paymentStatus: PaymentStatus.FAILED,
                },
            });
        } catch (error) {
            logger.error(error);
        }
    }

    //update transaction status and refund to user wallet
    async billPurchaseFailureHandler(options: BillPurchaseFailure) {
        try {
            const transaction = await this.prisma.transaction.findUnique({
                where: { id: options.transactionId },
                select: {
                    id: true,
                    userId: true,
                    totalAmount: true,
                    transactionId: true,
                },
            });
            if (!transaction) {
                throw new TransactionNotFoundException(
                    "Failed to process bill purchase failed event. Transaction ID not found",
                    HttpStatus.NOT_FOUND
                );
            }

            const userWallet = await this.prisma.wallet.findUnique({
                where: { userId: transaction.userId },
            });

            if (!userWallet) {
                return await this.prisma.transaction.update({
                    where: {
                        id: options.transactionId,
                    },
                    data: {
                        status: TransactionStatus.FAILED,
                    },
                });
            }

            //refund
            await this.prisma.$transaction(async (tx) => {
                await tx.wallet.update({
                    where: {
                        userId: transaction.userId,
                    },
                    data: {
                        mainBalance: {
                            increment: transaction.totalAmount,
                        },
                    },
                });
                await tx.transaction.update({
                    where: {
                        id: transaction.id,
                    },
                    data: {
                        status: TransactionStatus.FAILED,
                        paymentStatus: PaymentStatus.REFUNDED,
                    },
                });

                await tx.transaction.create({
                    data: {
                        amount: transaction.totalAmount,
                        totalAmount: transaction.totalAmount,
                        flow: TransactionFlow.IN,
                        status: TransactionStatus.SUCCESS,
                        paymentStatus: PaymentStatus.SUCCESS,
                        transactionId: generateId({ type: "transaction" }),
                        paymentChannel: PaymentChannel.SYSTEM,
                        type: TransactionType.WALLET_FUND,
                        walletFundTransactionFlow:
                            WalletFundTransactionFlow.FROM_FAILED_TRANSACTION,
                        userId: transaction.userId,
                        paymentReference: generateId({ type: "reference" }),
                        shortDescription:
                            TransactionShortDescription.BILL_PAYMENT_REFUND,
                        transId: transaction.id,
                    },
                });
            });
        } catch (error) {
            logger.error(error);
        }
    }

    async getBillHistory(
        options: PaginationDto,
        user: User
    ): Promise<ApiResponse> {
        const meta: Partial<PaginationMeta> = {};
        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                userId: user.id,
                status: TransactionStatus.SUCCESS,
                type: {
                    in: [
                        TransactionType.AIRTIME_PURCHASE,
                        TransactionType.CABLETV_BILL,
                        TransactionType.DATA_PURCHASE,
                        TransactionType.ELECTRICITY_BILL,
                        TransactionType.INTERNET_BILL,
                    ],
                },
            },
            select: {
                id: true,
                amount: true,
                packageType: true,
                billService: {
                    select: {
                        name: true,
                        icon: true,
                    },
                },
            },
        };

        //pagination
        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
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

        const result = {
            meta: meta,
            records: transactions,
        };

        return buildResponse({
            message: "Bill history successfully retrieved",
            data: result,
        });
    }

    computeCommission<T extends ComputeTypes>(
        options: ComputeCommissionOptions<T>
    ): ComputeCommissionResult<T> {
        // return parseFloat((1000 * commissionPercent).toFixed(2));

        //md commission amount
        const computeForMd = () => {
            const commission = parseFloat(
                (
                    (AGENT_MD_METER_COMMISSION_PERCENT / 100) *
                    options.amount
                ).toFixed(2)
            );
            const commissionAmount =
                commission > AGENT_MD_METER_COMMISSION_CAP_AMOUNT
                    ? AGENT_MD_METER_COMMISSION_CAP_AMOUNT
                    : commission;
            return {
                amount: commissionAmount,
            };
        };

        switch (options.type) {
            case "capped-subagent-md-meter": {
                const defaultMerchantCommission = parseFloat(
                    (
                        (AGENT_MD_METER_COMMISSION_PERCENT / 100) *
                        options.amount
                    ).toFixed(2)
                );

                if (
                    defaultMerchantCommission >
                    AGENT_MD_METER_COMMISSION_CAP_AMOUNT
                ) {
                    const newMerchantCommissionAmount =
                        AGENT_MD_METER_COMMISSION_CAP_AMOUNT -
                        options.subAgentMdMeterCapAmount;

                    return {
                        merchantAmount: newMerchantCommissionAmount,
                        subAgentAmount: options.subAgentMdMeterCapAmount,
                    } as ComputeCommissionResult<T>;
                }

                //divide the commission between the merchant and the sub-agent according to the given rate
                const subAgentCommission = parseFloat(
                    (
                        (SUBAGENT_MD_METER_COMMISSION_PERCENT / 100) *
                        options.amount
                    ).toFixed(2)
                );

                const newMerchantCommission = parseFloat(
                    (defaultMerchantCommission - subAgentCommission).toFixed(2)
                );

                return {
                    merchantAmount: newMerchantCommission,
                    subAgentAmount: subAgentCommission,
                } as ComputeCommissionResult<T>;
            }
            case "default-cap": {
                const defaultCappedAmount = parseFloat(
                    (
                        DEFAULT_CAPPING_MULTIPLIER * options.percentCommission
                    ).toFixed(2)
                );

                const commission = parseFloat(
                    (
                        (options.percentCommission / 100) *
                        options.amount
                    ).toFixed(2)
                );

                return {
                    amount:
                        commission > defaultCappedAmount
                            ? defaultCappedAmount
                            : commission,
                } as ComputeCommissionResult<T>;
            }

            case "capped-agent-md-meter": {
                return computeForMd() as ComputeCommissionResult<T>;
            }
            case "capped-merchant-md-meter": {
                return computeForMd() as ComputeCommissionResult<T>;
            }
            case "non-capped": {
                const commission = parseFloat(
                    (
                        (options.percentCommission / 100) *
                        options.amount
                    ).toFixed(2)
                );
                return {
                    amount: commission,
                } as ComputeCommissionResult<T>;
            }

            default:
                break;
        }
    }

    isCapped(billType: BillType) {
        const capped: BillType[] = [BillType.ELECTRICITY, BillType.CABLE_TV];
        if (capped.includes(billType)) {
            return true;
        }
        return false;
    }

    async computeBillCommissionHandler(transactionId: number) {
        try {
            const transaction = await this.prisma.transaction.findUnique({
                where: {
                    id: transactionId,
                },
                select: {
                    id: true,
                    userId: true,
                    type: true,
                    amount: true,
                    meterAccountType: true,
                    billService: {
                        select: {
                            slug: true,
                            type: true,
                            baseCommissionPercentage: true,
                            agentDefaultCommissionPercent: true,
                        },
                    },
                },
            });

            if (!transaction) {
                throw new ComputeBillCommissionException(
                    "Failed to compute and bill payment commission. transaction not found",
                    HttpStatus.NOT_FOUND
                );
            }

            //const vendorTypes = [UserType.MERCHANT, UserType.AGENT];
            const user = await this.prisma.user.findUnique({
                where: {
                    id: transaction.userId,
                },
                select: {
                    id: true,
                    userType: true,
                    identifier: true,
                    creator: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            if (!user) {
                throw new ComputeBillCommissionException(
                    "Failed to compute and bill payment commission. user not found",
                    HttpStatus.NOT_FOUND
                );
            }

            const billPurchaseTransactions = [
                TransactionType.AIRTIME_PURCHASE,
                TransactionType.AIRTIME_TO_CASH,
                TransactionType.CABLETV_BILL,
                TransactionType.DATA_PURCHASE,
                TransactionType.ELECTRICITY_BILL,
                TransactionType.INTERNET_BILL,
            ];

            if (!billPurchaseTransactions.includes(transaction.type as any)) {
                throw new ComputeBillCommissionException(
                    "Transaction type must include any of the bill payment transaction",
                    HttpStatus.NOT_IMPLEMENTED
                );
            }

            let baseCommission = null;
            if (
                transaction.billService.slug != BillServiceSlug.IKEJA_ELECTRIC
            ) {
                baseCommission =
                    (transaction.billService.baseCommissionPercentage / 100) *
                    transaction.amount;
            }

            //compute for subagents with their merchant only
            if (user.creator) {
                const [agentCommissionConfig, merchantCommissionConfig] =
                    await Promise.all([
                        this.prisma.userCommission.findUnique({
                            where: {
                                userId_billServiceSlug: {
                                    userId: user.id,
                                    billServiceSlug:
                                        transaction.billService.slug,
                                },
                            },
                        }),
                        this.prisma.userCommission.findUnique({
                            where: {
                                userId_billServiceSlug: {
                                    userId: user.creator.id,
                                    billServiceSlug:
                                        transaction.billService.slug,
                                },
                            },
                        }),
                    ]);

                //Merchant's agent with no commission assigned to
                if (!merchantCommissionConfig) {
                    throw new ComputeBillCommissionException(
                        "Failed to compute commission. The bill service commission not assigned to the subagent's merchant",
                        HttpStatus.NOT_FOUND
                    );
                }
                //merchant commission compute
                if (!agentCommissionConfig) {
                    //Ikeja :: only ikeja-electric has MD and Non MD Meter check
                    if (
                        transaction.billService.slug ==
                        BillServiceSlug.IKEJA_ELECTRIC
                    ) {
                        let merchantCommission: number;

                        if (
                            transaction.meterAccountType == MeterAccountType.MD
                        ) {
                            //md meter
                            merchantCommission = this.computeCommission({
                                type: "capped-merchant-md-meter",
                                amount: transaction.amount,
                            }).amount;
                        } else {
                            //non-md meter
                            merchantCommission = this.computeCommission({
                                type: "default-cap",
                                amount: transaction.amount,
                                percentCommission:
                                    merchantCommissionConfig.percentage,
                            }).amount;
                        }

                        //no computed commission for company on ikeja electric
                        await this.prisma.transaction.update({
                            where: {
                                id: transaction.id,
                            },
                            data: {
                                merchantCommission: merchantCommission,
                            },
                        });
                    } else {
                        //non ikeja
                        //Only electricity bills are capped
                        let merchantCommission: number;
                        if (this.isCapped(transaction.billService.type)) {
                            merchantCommission = this.computeCommission({
                                amount: transaction.amount,
                                type: "default-cap",
                                percentCommission:
                                    merchantCommissionConfig.percentage,
                            }).amount;
                        } else {
                            merchantCommission = this.computeCommission({
                                amount: transaction.amount,
                                type: "non-capped",
                                percentCommission:
                                    merchantCommissionConfig.percentage,
                            }).amount;
                        }

                        const companyCommission = parseFloat(
                            (baseCommission - merchantCommission).toFixed(2)
                        );

                        await this.prisma.transaction.update({
                            where: {
                                id: transaction.id,
                            },
                            data: {
                                merchantCommission: merchantCommission,
                                companyCommission: companyCommission,
                            },
                        });
                    }
                }

                //Merchant's agent with commission assigned to
                if (agentCommissionConfig) {
                    //ikeja
                    if (
                        transaction.billService.slug ==
                        BillServiceSlug.IKEJA_ELECTRIC
                    ) {
                        if (
                            transaction.meterAccountType == MeterAccountType.MD
                        ) {
                            const commission = this.computeCommission({
                                type: "capped-subagent-md-meter",
                                amount: transaction.amount,
                                subAgentMdMeterCapAmount:
                                    agentCommissionConfig.subAgentMdMeterCapAmount,
                            });

                            await this.prisma.transaction.update({
                                where: {
                                    id: transaction.id,
                                },
                                data: {
                                    merchantCommission:
                                        commission.merchantAmount,
                                    commission: commission.subAgentAmount,
                                },
                            });
                        } else {
                            //non-md meter
                            const agentCommission = this.computeCommission({
                                type: "default-cap",
                                amount: transaction.amount,
                                percentCommission:
                                    agentCommissionConfig.percentage,
                            }).amount;
                            const newMerchantCommissionPercent =
                                merchantCommissionConfig.percentage -
                                agentCommissionConfig.percentage;

                            const merchantCommission = this.computeCommission({
                                type: "default-cap",
                                amount: transaction.amount,
                                percentCommission: newMerchantCommissionPercent,
                            }).amount;

                            await this.prisma.transaction.update({
                                where: {
                                    id: transaction.id,
                                },
                                data: {
                                    merchantCommission: merchantCommission,
                                    commission: agentCommission,
                                },
                            });
                        }
                    } else {
                        //non ikeja
                        //capped
                        if (this.isCapped(transaction.billService.type)) {
                            //agent
                            const agentCommission = this.computeCommission({
                                type: "default-cap",
                                amount: transaction.amount,
                                percentCommission:
                                    agentCommissionConfig.percentage,
                            }).amount;

                            //merchant
                            const newMerchantCommissionPercent =
                                merchantCommissionConfig.percentage -
                                agentCommissionConfig.percentage;

                            const merchantCommission = this.computeCommission({
                                type: "default-cap",
                                amount: transaction.amount,
                                percentCommission: newMerchantCommissionPercent,
                            }).amount;

                            //company
                            const companyCommission = parseFloat(
                                (
                                    baseCommission -
                                    (merchantCommission + agentCommission)
                                ).toFixed(2)
                            );

                            await this.prisma.transaction.update({
                                where: {
                                    id: transaction.id,
                                },
                                data: {
                                    merchantCommission: merchantCommission,
                                    commission: agentCommission,
                                    companyCommission: companyCommission,
                                },
                            });
                        } else {
                            //non capped
                            //agent
                            const agentCommission = this.computeCommission({
                                type: "non-capped",
                                amount: transaction.amount,
                                percentCommission:
                                    agentCommissionConfig.percentage,
                            }).amount;

                            //merchant
                            const newMerchantCommissionPercent =
                                merchantCommissionConfig.percentage -
                                agentCommissionConfig.percentage;

                            const merchantCommission = this.computeCommission({
                                type: "non-capped",
                                amount: transaction.amount,
                                percentCommission: newMerchantCommissionPercent,
                            }).amount;

                            //company
                            const companyCommission = parseFloat(
                                (
                                    baseCommission -
                                    (merchantCommission + agentCommission)
                                ).toFixed(2)
                            );

                            await this.prisma.transaction.update({
                                where: {
                                    id: transaction.id,
                                },
                                data: {
                                    merchantCommission: merchantCommission,
                                    commission: agentCommission,
                                    companyCommission: companyCommission,
                                },
                            });
                        }
                    }
                }
            } else {
                //Compute for Merchant and upgradable-agents only
                let commissionPercent =
                    transaction.billService.agentDefaultCommissionPercent;
                if (user.userType == UserType.MERCHANT) {
                    const commissionConfig =
                        await this.prisma.userCommission.findUnique({
                            where: {
                                userId_billServiceSlug: {
                                    userId: user.id,
                                    billServiceSlug:
                                        transaction.billService.slug,
                                },
                            },
                        });

                    if (!commissionConfig) {
                        throw new ComputeBillCommissionException(
                            `Bill service commission with slug ${transaction.billService.slug} not assigned to userType, ${user.userType} with user identifier, ${user.identifier}`,
                            HttpStatus.NOT_FOUND
                        );
                    }
                    commissionPercent = commissionConfig.percentage;
                }

                if (
                    transaction.billService.slug ==
                    BillServiceSlug.IKEJA_ELECTRIC
                ) {
                    let agentCommission: number;

                    if (transaction.meterAccountType == MeterAccountType.MD) {
                        //md meter
                        agentCommission = this.computeCommission({
                            type: "capped-merchant-md-meter",
                            amount: transaction.amount,
                        }).amount;
                    } else {
                        //non-md meter
                        agentCommission = this.computeCommission({
                            type: "default-cap",
                            amount: transaction.amount,
                            percentCommission: commissionPercent,
                        }).amount;
                    }

                    //no companyCommission for ikeja electric
                    await this.prisma.transaction.update({
                        where: {
                            id: transaction.id,
                        },
                        data: {
                            commission: agentCommission,
                        },
                    });
                } else {
                    let agentCommission: number;
                    if (this.isCapped(transaction.billService.type)) {
                        agentCommission = this.computeCommission({
                            amount: transaction.amount,
                            type: "default-cap",
                            percentCommission: commissionPercent,
                        }).amount;
                    } else {
                        agentCommission = this.computeCommission({
                            amount: transaction.amount,
                            type: "non-capped",
                            percentCommission: commissionPercent,
                        }).amount;
                    }

                    const companyCommission = parseFloat(
                        (baseCommission - agentCommission).toFixed(2)
                    );

                    await this.prisma.transaction.update({
                        where: {
                            id: transaction.id,
                        },
                        data: {
                            commission: agentCommission,
                            companyCommission: companyCommission,
                        },
                    });
                }
            }
        } catch (error) {
            logger.error(error);
        }
    }

    //credits the merchant/agent wallet commission balance on a successful bill payment
    async payBillCommissionHandler(transactionId: number) {
        try {
            const transaction = await this.prisma.transaction.findUnique({
                where: {
                    id: transactionId,
                },
                select: {
                    id: true,
                    userId: true,
                    type: true,
                    amount: true,
                    commission: true,
                    merchantCommission: true,
                },
            });

            if (!transaction) {
                throw new PayBillCommissionException(
                    "Failed to credit wallet for the bill commission. Transaction not found",
                    HttpStatus.NOT_FOUND
                );
            }

            const user = await this.prisma.user.findUnique({
                where: {
                    id: transaction.userId,
                },
                select: {
                    id: true,
                    creator: {
                        select: {
                            id: true,
                        },
                    },
                },
            });

            if (!user) {
                throw new PayBillCommissionException(
                    "Commission payment failed. benefactor user account not found",
                    HttpStatus.NOT_FOUND
                );
            }

            //does the transaction has payable commission?
            if (transaction.commission || transaction.merchantCommission) {
                const transactionCreateOptions = {
                    amount: transaction.commission,
                    flow: TransactionFlow.IN,
                    status: TransactionStatus.SUCCESS,
                    totalAmount: transaction.commission,
                    type: TransactionType.WALLET_FUND,
                    userId: user.id,
                    paymentStatus: PaymentStatus.SUCCESS,
                    walletFundTransactionFlow:
                        WalletFundTransactionFlow.FROM_PAID_COMMISSION,

                    shortDescription:
                        TransactionShortDescription.COMMISSION_PAID,
                    paymentChannel: PaymentChannel.SYSTEM,
                    provider: PaymentChannel.SYSTEM,
                };

                //sub agent and Merchant both
                if (transaction.commission && transaction.merchantCommission) {
                    await this.prisma.$transaction(
                        async (tx) => {
                            //agent
                            await tx.wallet.update({
                                where: {
                                    userId: user.id,
                                },
                                data: {
                                    commissionBalance: {
                                        increment: transaction.commission,
                                    },
                                },
                            });

                            //merchant
                            await tx.wallet.update({
                                where: {
                                    userId: user.creator.id,
                                },
                                data: {
                                    commissionBalance: {
                                        increment:
                                            transaction.merchantCommission,
                                    },
                                },
                            });

                            const agentTransactionRecord: Prisma.TransactionUncheckedCreateInput =
                                {
                                    ...transactionCreateOptions,
                                    userId: user.id,
                                    transactionId: generateId({
                                        type: "transaction",
                                    }),
                                    paymentReference: generateId({
                                        type: "reference",
                                    }),
                                    transId: transaction.id,
                                };

                            const merchantTransactionRecord: Prisma.TransactionUncheckedCreateInput =
                                {
                                    ...transactionCreateOptions,
                                    amount: transaction.merchantCommission,
                                    totalAmount: transaction.merchantCommission,
                                    userId: user.creator.id,
                                    transactionId: generateId({
                                        type: "transaction",
                                    }),
                                    paymentReference: generateId({
                                        type: "reference",
                                    }),
                                    transId: transaction.id,
                                };

                            await tx.transaction.createMany({
                                data: [
                                    agentTransactionRecord,
                                    merchantTransactionRecord,
                                ],
                            });
                        },
                        {
                            isolationLevel:
                                Prisma.TransactionIsolationLevel.Serializable,
                        }
                    );
                } else {
                    //upgradable agent (default agents)
                    await this.prisma.$transaction(
                        async (tx) => {
                            await tx.wallet.update({
                                where: {
                                    userId: user.id,
                                },
                                data: {
                                    commissionBalance: {
                                        increment: transaction.commission,
                                    },
                                },
                            });

                            const transactionRecord: Prisma.TransactionUncheckedCreateInput =
                                {
                                    ...transactionCreateOptions,
                                    transactionId: generateId({
                                        type: "transaction",
                                    }),
                                    paymentReference: generateId({
                                        type: "reference",
                                    }),
                                    transId: transaction.id,
                                };

                            await tx.transaction.create({
                                data: transactionRecord,
                            });
                        },
                        { timeout: DB_TRANSACTION_TIMEOUT }
                    );
                }
            }
        } catch (error) {
            logger.error(error);
        }
    }

    isServiceChargeApplicable(options: CheckServiceChargeOptions): boolean {
        if (options.userType != UserType.CUSTOMER) {
            return false;
        }

        const chargeableBills: TransactionType[] = [
            TransactionType.ELECTRICITY_BILL,
            TransactionType.CABLETV_BILL,
        ];

        if (!chargeableBills.includes(options.billType)) {
            return false;
        }

        if (!options.serviceCharge) {
            throw new BillPaymentValidationException(
                "Service charge is required for the account type",
                HttpStatus.BAD_REQUEST
            );
        }

        return true;
    }

    async adminUpdateDefaultBillProvider(
        options: UpdateDefaultBillProviderDto
    ) {
        const handler = async (providerSlug: string) => {
            const provider = await this.prisma.billProvider.findUnique({
                where: { slug: providerSlug },
            });
            if (!provider) {
                throw new BillProviderNotFoundException(
                    "provider not found",
                    HttpStatus.NOT_FOUND
                );
            }

            const updated = await this.prisma.$transaction(async (tx) => {
                const updated = await tx.billProvider.update({
                    where: { id: provider.id },
                    data: {
                        isDefault: true,
                    },
                    select: {
                        id: true,
                        isDefault: true,
                        name: true,
                    },
                });

                await tx.billProvider.updateMany({
                    where: {
                        id: {
                            not: provider.id,
                        },
                    },
                    data: {
                        isDefault: false,
                    },
                });
                return updated;
            });
            return updated;
        };

        switch (options.provider) {
            case BillProviderEnum.BUYPOWER: {
                const updated = await handler(
                    BillProviderSlugForPower.BUYPOWER
                );
                return buildResponse({
                    message: "provider successfully set",
                    data: updated,
                });
            }

            case BillProviderEnum.IRECHARGE: {
                const updated = await handler(
                    BillProviderSlugForPower.IRECHARGE
                );
                return buildResponse({
                    message: "provider successfully set",
                    data: updated,
                });
            }

            default: {
                throw new InvalidBillProviderException(
                    "invalid provider selected",
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    async getProviders() {
        const providers = await this.prisma.billProvider.findMany({
            select: {
                id: true,
                name: true,
                isDefault: true,
            },
        });

        return buildResponse({
            message: "providers successfully retrieved",
            data: providers,
        });
    }
}
