import { PrismaService } from "@/modules/core/prisma/services";
import { endOfMonth, startOfMonth } from "date-fns";
import { User, TransactionStatus, Prisma } from "@prisma/client";
import {
    SuccessfulTransactionsDto,
    TransactionHistoryDto,
    TransactionReportType,
} from "../dtos";
import { buildResponse } from "@/utils/api-response-util";
import { Injectable } from "@nestjs/common";
import { PaginationMeta } from "@/utils";

@Injectable()
export class TransactionStatService {
    constructor(private prisma: PrismaService) {}

    async successfulTransactions(
        options: SuccessfulTransactionsDto,
        user: User
    ) {
        const startDate = startOfMonth(new Date(options.date));
        const endDate = endOfMonth(new Date(options.date));

        const transaction = await this.prisma.transaction.count({
            where: {
                userId: user.id,
                status: TransactionStatus.SUCCESS,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        return buildResponse({
            message: "Transaction fetched successfully",
            data: transaction,
        });
    }

    async fetchTotalCommission(options: SuccessfulTransactionsDto, user: User) {
        const startDate = startOfMonth(new Date(options.date));
        const endDate = endOfMonth(new Date(options.date));

        const agentCommission = await this.prisma.transaction.aggregate({
            _sum: {
                merchantCommission: true,
            },
            where: {
                user: {
                    createdById: user.id,
                },
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
        const merchantCommission = await this.prisma.transaction.aggregate({
            _sum: {
                commission: true,
            },
            where: {
                userId: user.id,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const totalCommission =
            merchantCommission._sum.commission +
            agentCommission._sum.merchantCommission;

        return buildResponse({
            message: "Total commission fetched successfully",
            data: totalCommission,
        });
    }

    async transactionHistory(options: TransactionHistoryDto, user: User) {
        const paginationMeta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                userId: user.id,
            },
            select: {
                id: true,
                amount: true,
                shortDescription: true,
                paymentStatus: true,
                status: true,
                transactionId: true,
                paymentChannel: true,
                merchantCommission: true,
                commission: true,
                flow: true,
                type: true,
                createdAt: true,
            },
        };

        switch (options.type) {
            case TransactionReportType.AIRTIME: {
                queryOptions.where.type = TransactionReportType.AIRTIME;
                break;
            }
            case TransactionReportType.CABLETV: {
                queryOptions.where.type = TransactionReportType.CABLETV;
                break;
            }
            case TransactionReportType.DATA: {
                queryOptions.where.type = TransactionReportType.DATA;
                break;
            }
            case TransactionReportType.ELECTRICITY: {
                queryOptions.where.type = TransactionReportType.ELECTRICITY;
                break;
            }
            case TransactionReportType.PAYOUT: {
                queryOptions.where.type = TransactionReportType.PAYOUT;
                break;
            }
        }

        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.transaction.count({
                where: queryOptions.where,
            });
            paginationMeta.totalCount = count;
            paginationMeta.perPage = limit;
        }

        const transactions = await this.prisma.transaction.findMany(
            queryOptions
        );
        if (options.pagination) {
            paginationMeta.pageCount = transactions.length;
        }

        return buildResponse({
            message: "Transaction history retrieved successfully",
            data: {
                meta: paginationMeta,
                records: transactions,
            },
        });
    }
}
