import { PrismaService } from "@/modules/core/prisma/services";
import { buildResponse } from "@/utils";
import { Injectable } from "@nestjs/common";
import { FetchCommissionDto } from "../dtos";
import { TransactionStatus, User } from "@prisma/client";
import { endOfMonth, startOfMonth } from "date-fns";

@Injectable()
export class CommissionStatService {
    constructor(private prisma: PrismaService) {}

    private getDateRange(date: Date) {
        const monthStarts = startOfMonth(new Date(date));
        const monthEnds = endOfMonth(new Date(date));

        return {
            monthStarts,
            monthEnds,
        };
    }

    //fetch company commission
    async fetchTotalCommission(options: FetchCommissionDto) {
        const totalCommission = await this.prisma.transaction.aggregate({
            _sum: {
                companyCommission: true,
            },
            where: {
                status: TransactionStatus.SUCCESS,
                createdAt: {
                    gte: this.getDateRange(options.date).monthStarts,
                    lte: this.getDateRange(options.date).monthEnds,
                },
            },
        });

        return buildResponse({
            message: "Total commission fetched successfully",
            data: {
                commission: totalCommission._sum.companyCommission || 0,
            },
        });
    }

    async fetchMerchantTotalCommission(
        options: FetchCommissionDto,
        user: User
    ) {
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
            data: {
                commission: totalCommission,
            },
        });
    }
}
