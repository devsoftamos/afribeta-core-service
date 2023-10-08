import { PrismaService } from "@/modules/core/prisma/services";
import { ApiResponse, buildResponse, computeCap } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import { BillType, User } from "@prisma/client";
import { BillServiceSlug } from "../../bill/interfaces";
import { ListAgencyCommission, ListMerchantCommission } from "../interfaces";
import {
    AGENT_MD_METER_COMMISSION_CAP_AMOUNT,
    AGENT_MD_METER_COMMISSION_PERCENT,
} from "@/config";
import { UpdateSingleBillCommissionDto } from "../dtos";
import { BillCommissionException } from "../errors";

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

        const result: ListMerchantCommission[] = billCommissions.map((bc) => {
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

    async adminGetAgencyServiceCommissions() {
        const commissions = await this.prisma.billService.findMany({
            select: {
                baseCommissionPercentage: true,
                agentDefaultCommissionPercent: true,
                name: true,
                slug: true,
                type: true,
            },
        });

        const result: ListAgencyCommission[] = commissions.map((bc) => {
            return {
                name: bc.name,
                slug: bc.slug,
                baseCommission: bc.baseCommissionPercentage,
                agentCommission: bc.agentDefaultCommissionPercent,
                type: bc.type,
            };
        });

        return buildResponse({
            message: "Bill service commissions successfully retrieved",
            data: result,
        });
    }

    async updateDefaultAgentSingleBillCommission(
        options: UpdateSingleBillCommissionDto
    ) {
        const billService = await this.prisma.billService.findUnique({
            where: {
                slug: options.slug,
            },
        });

        if (!billService) {
            throw new BillCommissionException(
                "Failed to update default agent commission. Bill service not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (
            options.slug !== BillServiceSlug.IKEJA_ELECTRIC &&
            options.percentage > billService.baseCommissionPercentage
        ) {
            throw new BillCommissionException(
                "Failed to update default agent commission. The agent commission must not be greater than the base commission",
                HttpStatus.BAD_REQUEST
            );
        }

        await this.prisma.billService.update({
            where: {
                id: billService.id,
            },
            data: {
                agentDefaultCommissionPercent: options.percentage,
            },
        });

        return buildResponse({
            message: "Default agent commission successfully updated",
        });
    }

    async updateSingleBillServiceBaseCommission(
        options: UpdateSingleBillCommissionDto
    ) {
        const billService = await this.prisma.billService.findUnique({
            where: {
                slug: options.slug,
            },
        });

        if (!billService) {
            throw new BillCommissionException(
                "Failed to update base commission. Bill service not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (billService.slug == BillServiceSlug.IKEJA_ELECTRIC) {
            throw new BillCommissionException(
                "Failed to update base commission. Base commission update for Ikeja Electric not supported",
                HttpStatus.BAD_REQUEST
            );
        }

        const invalidPercentageCommission =
            await this.prisma.userCommission.findFirst({
                where: {
                    billServiceSlug: options.slug,
                    percentage: {
                        gt: options.percentage,
                    },
                },
            });

        if (invalidPercentageCommission) {
            throw new BillCommissionException(
                "Failed to update base commission. An already assigned user commission is greater than the the new base commission",
                HttpStatus.BAD_REQUEST
            );
        }

        await this.prisma.billService.update({
            where: {
                id: billService.id,
            },
            data: {
                baseCommissionPercentage: options.percentage,
            },
        });

        return buildResponse({
            message: "Base commission successfully updated",
        });
    }
}
