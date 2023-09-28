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
    SubAgentMdCommissionData,
    WalletChargeHandler,
    BillServiceSlug,
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
    ComputeBillCommissionException,
    PayBillCommissionException,
    WalletChargeException,
} from "../errors";
import { AirtimeBillService } from "./airtime";
import { InternetBillService } from "./internet";
import { CableTVBillService } from "./cabletv";
import { PaginationDto } from "../dtos";
import {
    ApiResponse,
    buildResponse,
    generateId,
    PaginationMeta,
} from "@/utils";
import { TransactionShortDescription } from "../../transaction";

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
                    await tx.wallet.update({
                        where: {
                            id: options.walletId,
                        },
                        data: {
                            mainBalance: {
                                decrement: options.amount,
                            },
                        },
                    });

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
                }
            );
        } catch (error) {
            throw new WalletChargeException(
                "Failed to complete wallet charge",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
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

    async billPurchaseFailureHandler(options: BillPurchaseFailure) {
        try {
            await this.prisma.transaction.update({
                where: {
                    id: options.transactionId,
                },
                data: {
                    status: TransactionStatus.FAILED,
                },
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
                const merchantCommission = parseFloat(
                    (
                        (AGENT_MD_METER_COMMISSION_PERCENT / 100) *
                        options.amount
                    ).toFixed(2)
                );

                if (merchantCommission > AGENT_MD_METER_COMMISSION_CAP_AMOUNT) {
                    return {
                        merchantAmount:
                            AGENT_MD_METER_COMMISSION_CAP_AMOUNT -
                            options.subAgentMdMeterCapAmount,
                        subAgentAmount: options.subAgentMdMeterCapAmount,
                    } as ComputeCommissionResult<T>;
                }
                const subAgentCommission = parseFloat(
                    (
                        (SUBAGENT_MD_METER_COMMISSION_PERCENT / 100) *
                        options.amount
                    ).toFixed(2)
                );

                return {
                    merchantAmount: merchantCommission,
                    subAgentAmount: subAgentCommission,
                } as ComputeCommissionResult<T>;
            }
            case "default-cap": {
                const defaultCappedAmount =
                    DEFAULT_CAPPING_MULTIPLIER * options.percentCommission;

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
        if (billType == BillType.ELECTRICITY) {
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
            if (transaction.billService.slug != BillServiceSlug.IKEJA_ELECTRIC) {
                baseCommission =
                    (transaction.billService.baseCommissionPercentage / 100) *
                    transaction.amount;
            }

            //compute for agents with merchant
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
                    if (transaction.billService.slug == BillServiceSlug.IKEJA_ELECTRIC) {
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
                    if (transaction.billService.slug == BillServiceSlug.IKEJA_ELECTRIC) {
                        if (
                            transaction.meterAccountType == MeterAccountType.MD
                        ) {
                            const commission = this.computeCommission({
                                type: "capped-subagent-md-meter",
                                amount: transaction.amount,
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
                //Merchant and upgradable-agent-merchant
                const commissionConfig =
                    await this.prisma.userCommission.findUnique({
                        where: {
                            userId_billServiceSlug: {
                                userId: user.id,
                                billServiceSlug: transaction.billService.slug,
                            },
                        },
                    });

                if (!commissionConfig) {
                    throw new ComputeBillCommissionException(
                        `Bill service commission with slug ${transaction.billService.slug} not assigned to userType, ${user.userType} with user identifier, ${user.identifier}`,
                        HttpStatus.NOT_FOUND
                    );
                }

                if (transaction.billService.slug == BillServiceSlug.IKEJA_ELECTRIC) {
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
                            percentCommission: commissionConfig.percentage,
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
                            percentCommission: commissionConfig.percentage,
                        }).amount;
                    } else {
                        agentCommission = this.computeCommission({
                            amount: transaction.amount,
                            type: "non-capped",
                            percentCommission: commissionConfig.percentage,
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
                    "Commission payment failed. User not found",
                    HttpStatus.NOT_FOUND
                );
            }

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

                //Agent and Merchant
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

                            const transactionId = generateId({
                                type: "transaction",
                            });

                            const agentTransactionRecord: Prisma.TransactionUncheckedCreateInput =
                                {
                                    ...transactionCreateOptions,
                                    userId: user.id,
                                    transactionId: transactionId,
                                    paymentReference: generateId({
                                        type: "reference",
                                    }),
                                };

                            const merchantTransactionRecord: Prisma.TransactionUncheckedCreateInput =
                                {
                                    ...transactionCreateOptions,
                                    amount: transaction.merchantCommission,
                                    totalAmount: transaction.merchantCommission,
                                    userId: user.creator.id,
                                    transactionId: transactionId,
                                    paymentReference: generateId({
                                        type: "reference",
                                    }),
                                };

                            await tx.transaction.createMany({
                                data: [
                                    agentTransactionRecord,
                                    merchantTransactionRecord,
                                ],
                            });
                        },
                        { timeout: DB_TRANSACTION_TIMEOUT }
                    );
                } else {
                    //Merchant/upgradable-merchant-agent
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

                            const transactionId = generateId({
                                type: "transaction",
                            });

                            const transactionRecord: Prisma.TransactionUncheckedCreateInput =
                                {
                                    ...transactionCreateOptions,
                                    transactionId: transactionId,
                                    paymentReference: generateId({
                                        type: "reference",
                                    }),
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
}
