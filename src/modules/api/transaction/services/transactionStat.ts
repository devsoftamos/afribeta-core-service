import { PrismaService } from "@/modules/core/prisma/services";
import { endOfMonth, startOfMonth } from "date-fns";
import { User, TransactionStatus } from "@prisma/client";
import { SuccessfulTransactionsDto } from "../dtos";
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

    async fetchTotalCommission(
        options: SuccessfulTeransactionsDto,
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
}
