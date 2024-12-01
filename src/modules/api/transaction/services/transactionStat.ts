import { PrismaService } from "@/modules/core/prisma/services";
import {
    endOfDay,
    endOfMonth,
    endOfWeek,
    startOfDay,
    startOfMonth,
    startOfWeek,
} from "date-fns";
import {
    User,
    TransactionStatus,
    WalletFundTransactionFlow,
    TransactionType,
} from "@prisma/client";
import { AllTransactionStatDto, SuccessfulTransactionsDto } from "../dtos";
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

    // private async aggregateTotalTransaction(
    //     startDate: Date,
    //     endDate: Date,
    //     status: TransactionStatus
    // ) {
    //     return await this.prisma.transaction.aggregate({
    //         _sum: {
    //             totalAmount: true,
    //         },
    //         where: {
    //             OR: [
    //                 { walletFundTransactionFlow: null },
    //                 {
    //                     walletFundTransactionFlow: {
    //                         notIn: [
    //                             WalletFundTransactionFlow.FROM_BENEFACTOR,
    //                             WalletFundTransactionFlow.FROM_MERCHANT,
    //                         ], //exclude one of the internal transaction i.e record for the receiver
    //                     },
    //                 },
    //             ],
    //             status: status,
    //             createdAt: {
    //                 gte: startDate,
    //                 lte: endDate,
    //             },
    //         },
    //     });
    // }

    async fetchTotalTransactions(options: SuccessfulTransactionsDto) {
        const successfulTransactions = await this.sumPeriodicTrans(
            this.getDateRange(options.date).monthStarts,
            this.getDateRange(options.date).monthEnds,
            TransactionStatus.SUCCESS
        );

        const failedTransactions = await this.sumPeriodicTrans(
            this.getDateRange(options.date).monthStarts,
            this.getDateRange(options.date).monthEnds,
            TransactionStatus.FAILED
        );

        return buildResponse({
            message: "Transaction statistics retrieved successfully",
            data: {
                successfulTransactions:
                    successfulTransactions._sum.totalAmount || 0,
                failedTransactions: failedTransactions._sum.totalAmount || 0,
            },
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

    async getAdminDashboardTransStat(options: AllTransactionStatDto) {
        const date = options.date ?? new Date();
        const monthlyTransactions = await this.sumPeriodicTrans(
            this.getDateRange(date).monthStarts,
            this.getDateRange(date).monthEnds,
            TransactionStatus.SUCCESS
        );

        const dailyTransactions = await this.sumPeriodicTrans(
            this.getDateRange(date).dayStarts,
            this.getDateRange(date).dayEnds,
            TransactionStatus.SUCCESS
        );

        const weeklyTransactions = await this.sumPeriodicTrans(
            this.getDateRange(date).weekStarts,
            this.getDateRange(date).weekEnds,
            TransactionStatus.SUCCESS
        );
        return buildResponse({
            message: "successfully retrieved stat",
            data: {
                monthlyTransactions: monthlyTransactions._sum?.totalAmount || 0,
                dailyTransactions: dailyTransactions._sum?.totalAmount || 0,
                weeklyTransactions: weeklyTransactions._sum?.totalAmount || 0,
            },
        });
    }

    private async sumPeriodicTrans(
        startDate: Date,
        endDate: Date,
        status: TransactionStatus
    ) {
        return await this.prisma.transaction.aggregate({
            _sum: {
                totalAmount: true,
            },
            where: {
                // OR: [
                //     { walletFundTransactionFlow: null },
                //     {
                //         walletFundTransactionFlow: {
                //             notIn: [
                //                 WalletFundTransactionFlow.FROM_BENEFACTOR,
                //                 WalletFundTransactionFlow.FROM_MERCHANT,
                //                 WalletFundTransactionFlow.COMMISSION_BALANCE_TO_MAIN_BALANCE,
                //                 WalletFundTransactionFlow.FROM_FAILED_TRANSACTION,
                //             ],
                //         },
                //     },
                // ],
                type: {
                    in: [
                        TransactionType.AIRTIME_PURCHASE,
                        TransactionType.CABLETV_BILL,
                        TransactionType.DATA_PURCHASE,
                        TransactionType.ELECTRICITY_BILL,
                        TransactionType.INTERNET_BILL,
                        TransactionType.AIRTIME_TO_CASH,
                    ],
                },

                status: status,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
    }
}
