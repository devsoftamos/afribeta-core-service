import { PrismaService } from "@/modules/core/prisma/services";
import { ApiResponse, buildResponse } from "@/utils";
import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";

@Injectable()
export class CommissionService {
    constructor(private prisma: PrismaService) {}

    async getServiceCommissions(user: User): Promise<ApiResponse> {
        const billCommissions = await this.prisma.userCommission.findMany({
            where: {
                userId: user.id,
            },
            select: {
                percentage: true,
                percentMd: true,
                percentNonMd: true,
                billService: {
                    select: {
                        name: true,
                        slug: true,
                        type: true,
                    },
                },
            },
        });
        return buildResponse({
            message: "Bill service commissions successfully retrieved",
            data: billCommissions,
        });
    }
}
