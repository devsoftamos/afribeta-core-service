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

    //successful transactions on bill purchase/payment
    async successfulTransactionsOnBillPayment(
        options: SuccessfulTransactionsDto
    ) {
        const billPaymentTypesToFilter = [
            BillPayment.AIRTIME_PURCHASE,
            BillPayment.AIRTIME_TO_CASH,
            BillPayment.CABLETV_BILL,
            BillPayment.DATA_PURCHASE,
            BillPayment.ELECTRICITY_BILL,
            BillPayment.INTERNET_BILL,
        ];

        const weekStarts = startOfWeek(new Date(options.date));
        const weekEnds = endOfWeek(new Date(options.date));
        const monthStarts = startOfMonth(new Date(options.date));
        const monthEnds = endOfMonth(new Date(options.date));
        const dayStarts = startOfDay(new Date(options.date));
        const dayEnds = endOfDay(new Date(options.date));

        const monthlyTransactions = await this.prisma.transaction.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                type: {
                    in: billPaymentTypesToFilter,
                },
                status: TransactionStatus.SUCCESS,
                createdAt: {
                    gte: monthStarts,
                    lte: monthEnds,
                },
            },
        });

        const dailyTransactions = await this.prisma.transaction.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                type: {
                    in: billPaymentTypesToFilter,
                },
                status: TransactionStatus.SUCCESS,
                createdAt: {
                    gte: dayStarts,
                    lte: dayEnds,
                },
            },
        });

        const weeklyTransactions = await this.prisma.transaction.count({
            where: {
                type: {
                    in: billPaymentTypesToFilter,
                },
                status: TransactionStatus.SUCCESS,
                createdAt: {
                    gte: weekStarts,
                    lte: weekEnds,
                },
            },
        });
        return buildResponse({
            message: "Transaction overview fetched successfully",
            data: {
                monthlyTransactions: monthlyTransactions,
                dailyTransactions: dailyTransactions,
                weeklyTransactions: weeklyTransactions,
            },
        });
    }
}
