import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
    PaymentStatus,
    Prisma,
    TransactionStatus,
    TransactionType,
    User,
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
import { WalletChargeException } from "../errors";
import { AirtimeBillService } from "./airtime";
import { InternetBillService } from "./internet";
import { CableTVBillService } from "./cabletv";
import { PaginationDto } from "../dtos";
import { ApiResponse, buildResponse, PaginationMeta } from "@/utils";

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
}
