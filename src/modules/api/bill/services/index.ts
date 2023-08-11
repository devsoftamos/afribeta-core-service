import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
    PaymentStatus,
    Prisma,
    TransactionStatus,
    TransactionType,
    User,
    UserType,
} from "@prisma/client";
import {
    BillPaymentFailure,
    BillPurchaseFailure,
    ProcessBillPaymentOptions,
    WalletChargeHandler,
} from "../interfaces";
import logger from "moment-logger";
import { PowerBillService } from "./power";
import { DataBillService } from "./data";
import { PrismaService } from "@/modules/core/prisma/services";
import { DB_TRANSACTION_TIMEOUT } from "@/config";
import {
    ComputeBillCommissionException,
    WalletChargeException,
} from "../errors";
import { AirtimeBillService } from "./airtime";
import { InternetBillService } from "./internet";
import { CableTVBillService } from "./cabletv";
import { PaginationDto } from "../dtos";
import { ApiResponse, buildResponse, PaginationMeta } from "@/utils";
import { TransactionNotFoundException } from "../../transaction";

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
                    id: options.transaction.id,
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
        const { transaction } = options;
        try {
            await this.prisma.transaction.update({
                where: {
                    id: transaction.id,
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
                    billService: {
                        select: {
                            slug: true,
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

            const vendorTypes = [UserType.MERCHANT, UserType.AGENT];
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

            if (!vendorTypes.includes(user.userType as any)) {
                throw new ComputeBillCommissionException(
                    "Failed to assign bill payment commission. User must be merchant or agent",
                    HttpStatus.NOT_IMPLEMENTED
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

            let agentCommission = 0;
            let merchantCommission = 0;
            const baseCommission =
                transaction.billService.baseCommissionPercentage *
                transaction.amount;

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
                        `Bill service commission with slug ${transaction.billService.slug} not assigned to userType, ${user.userType} with user identifier, ${user.identifier}`,
                        HttpStatus.NOT_FOUND
                    );
                }

                if (!agentCommissionConfig) {
                    merchantCommission =
                        merchantCommissionConfig.percentage *
                        transaction.amount;
                    const companyCommission =
                        baseCommission - merchantCommission;

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

                //Merchant's agent with commission assigned to
                if (agentCommissionConfig) {
                    agentCommission =
                        agentCommissionConfig.percentage * transaction.amount; //depends on merchant
                    merchantCommission =
                        merchantCommissionConfig.percentage *
                        transaction.amount;
                    const companyCommission =
                        baseCommission - merchantCommission;
                    await this.prisma.transaction.update({
                        where: {
                            id: transaction.id,
                        },
                        data: {
                            merchantCommission: merchantCommission,
                            companyCommission: companyCommission,
                            commission: agentCommission,
                        },
                    });
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

                const commission =
                    commissionConfig.percentage * transaction.amount;

                const companyCommission = baseCommission - commission;

                await this.prisma.transaction.update({
                    where: {
                        id: transaction.id,
                    },
                    data: {
                        commission: commission,
                        companyCommission: companyCommission,
                    },
                });
            }
        } catch (error) {
            logger.error(error);
        }
    }
}
