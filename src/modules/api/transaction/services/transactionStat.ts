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

    billPaymentTypesToFilter = [
        BillPayment.AIRTIME_PURCHASE,
        BillPayment.AIRTIME_TO_CASH,
        BillPayment.CABLETV_BILL,
        BillPayment.DATA_PURCHASE,
        BillPayment.ELECTRICITY_BILL,
        BillPayment.INTERNET_BILL,
    ];

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
                    in: this.billPaymentTypesToFilter,
                },
                status: TransactionStatus.SUCCESS,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
    }

    //successful transactions on bill purchase/payment
    async successfulTransactionsOnBillPayment(
        options: SuccessfulTransactionsDto
    ) {
        const weekStarts = startOfWeek(new Date(options.date));
        const weekEnds = endOfWeek(new Date(options.date));
        const monthStarts = startOfMonth(new Date(options.date));
        const monthEnds = endOfMonth(new Date(options.date));
        const dayStarts = startOfDay(new Date(options.date));
        const dayEnds = endOfDay(new Date(options.date));

        const monthlyTransactions = await this.aggregateBillPaymentTransactions(
            monthStarts,
            monthEnds
        );

        const dailyTransactions = await this.aggregateBillPaymentTransactions(
            dayStarts,
            dayEnds
        );

        const weeklyTransactions = await this.aggregateBillPaymentTransactions(
            weekStarts,
            weekEnds
        );
        return buildResponse({
            message: "Transaction overview fetched successfully",
            data: {
                monthlyTransactions: monthlyTransactions._sum.amount,
                dailyTransactions: dailyTransactions._sum.amount || 0,
                weeklyTransactions: weeklyTransactions._sum.amount || 0,
            },
        });
    }
}
