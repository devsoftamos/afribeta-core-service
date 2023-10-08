import { PrismaService } from "@/modules/core/prisma/services";
import { ApiResponse, buildResponse, computeCap } from "@/utils";
import { Injectable } from "@nestjs/common";
import { BillType, User } from "@prisma/client";
import { BillServiceSlug } from "../../bill/interfaces";
import { ListAgencyCommission } from "../interfaces";
import {
    AGENT_MD_METER_COMMISSION_CAP_AMOUNT,
    AGENT_MD_METER_COMMISSION_PERCENT,
} from "@/config";

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
                billService: {
                    select: {
                        name: true,
                        slug: true,
                        type: true,
                    },
                },
            },
        });

        const result: ListAgencyCommission[] = billCommissions.map((bc) => {
            if (bc.billService.slug == BillServiceSlug.IKEJA_ELECTRIC) {
                return {
                    name: bc.billService.name,
                    slug: bc.billService.slug,
                    type: bc.billService.type,
                    commission: bc.percentage,
                    cap:
                        bc.billService.type == BillType.ELECTRICITY
                            ? computeCap(bc.percentage)
                            : null,
                    commissionMd: AGENT_MD_METER_COMMISSION_PERCENT,
                    capMd: AGENT_MD_METER_COMMISSION_CAP_AMOUNT,
                };
            }
            return {
                name: bc.billService.name,
                slug: bc.billService.slug,
                type: bc.billService.type,
                commission: bc.percentage,
                cap:
                    bc.billService.type == BillType.ELECTRICITY
                        ? computeCap(bc.percentage)
                        : null,
            };
        });

        return buildResponse({
            message: "Bill service commissions successfully retrieved",
            data: result,
        });
    }
}
