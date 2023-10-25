import { PrismaService } from "@/modules/core/prisma/services";
import {
    endOfDay,
    endOfMonth,
    endOfWeek,
    startOfDay,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import { User, TransactionStatus } from "@prisma/client";
import { SuccessfulTransactionsDto, BillPayment } from "../dtos";
import { buildResponse } from "@/utils/api-response-util";
import { Injectable } from "@nestjs/common";

@Injectable()
export class TransactionStatService {
    constructor(private prisma: PrismaService) {}

    private getDateRange(date: Date) {
        const weekStarts = startOfWeek(new Date(date));
        const weekEnds = endOfWeek(new Date(date));
        const monthStarts = startOfMonth(new Date(date));
        const monthEnds = endOfMonth(new Date(date));
        const dayStarts = startOfDay(new Date(date));
        const dayEnds = endOfDay(new Date(date));

        return {
            weekStarts,
            weekEnds,
            monthStarts,
            monthEnds,
            dayStarts,
            dayEnds,
        };
    }

    async successfulTransactions(
        options: SuccessfulTransactionsDto,
        user: User
    ) {
        const transaction = await this.prisma.transaction.count({
            where: {
                userId: user.id,
                status: TransactionStatus.SUCCESS,
                createdAt: {
                    gte: this.getDateRange(options.date).monthStarts,
                    lte: this.getDateRange(options.date).monthEnds,
                },
            },
        });

        return buildResponse({
            message: "Transaction fetched successfully",
            data: transaction,
        });
    }

    async fetchMerchantTotalCommission(
        options: SuccessfulTransactionsDto,
        user: User
    ) {
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
                    gte: this.getDateRange(options.date).monthStarts,
                    lte: this.getDateRange(options.date).monthEnds,
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
                    gte: this.getDateRange(options.date).monthStarts,
                    lte: this.getDateRange(options.date).monthEnds,
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

    private async getBillPaymentsToFilter() {
        return [
            BillPayment.AIRTIME_PURCHASE,
            BillPayment.AIRTIME_TO_CASH,
            BillPayment.CABLETV_BILL,
            BillPayment.DATA_PURCHASE,
            BillPayment.ELECTRICITY_BILL,
            BillPayment.INTERNET_BILL,
        ];
    }

    private async aggregateBillPaymentTransactions(
        startDate: Date,
        endDate: Date
    ) {
        return await this.prisma.transaction.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                type: {
                    in: await this.getBillPaymentsToFilter(),
                },
                status: TransactionStatus.SUCCESS,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
    }

    async fetchTotalTransactions(options: SuccessfulTransactionsDto) {
        const startDate = startOfMonth(new Date(options.date));
        const endDate = endOfMonth(new Date(options.date));

        const successfulTransactions = await this.aggregateTotalTransaction(
            startDate,
            endDate,
            TransactionStatus.SUCCESS
        );

        const failedTransactions = await this.aggregateTotalTransaction(
            startDate,
            endDate,
            TransactionStatus.FAILED
        );

        return buildResponse({
            message: "Transaction statistics retrieved successfully",
            data: {
                successfulTransactions: successfulTransactions._sum.amount || 0,
                failedTransactions: failedTransactions._sum.amount || 0,
            },
        });
    }

    async fetchTotalCommission(options: SuccessfulTransactionsDto) {
        const startDate = startOfMonth(new Date(options.date));
        const endDate = endOfMonth(new Date(options.date));

        const totalCommission = await this.prisma.transaction.aggregate({
            _sum: {
                commission: true,
            },
            where: {
                status: TransactionStatus.SUCCESS,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        return buildResponse({
            message: "Total commission fetched successfully",
            data: {
                commission: totalCommission._sum.commission,
            },
        });
    }
}
