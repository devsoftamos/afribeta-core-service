import { PrismaService } from "@/modules/core/prisma/services";
import { ApiResponse, buildResponse, computeCap, groupBy } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import { BillType, User } from "@prisma/client";
import { BillServiceSlug } from "../../bill/interfaces";
import {
    ListAgencyCommission,
    ListMerchantCommission,
    ListSubagentCommission,
} from "../interfaces";
import {
    AGENT_MD_METER_COMMISSION_CAP_AMOUNT,
    AGENT_MD_METER_COMMISSION_PERCENT,
} from "@/config";
import {
    DeleteSubagentCommissionDto,
    UpdateSingleBillCommissionDto,
    UpdateSubagentCommissionDto,
} from "../dtos";
import { BillCommissionException } from "../errors";
import { UserNotFoundException } from "../../user";

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

    async merchantGetSubagentsBillCommissions(
        user: User,
        subagentId: number
    ): Promise<ApiResponse> {
        const subagentUser = await this.prisma.user.findFirst({
            where: {
                id: subagentId,
                createdById: user.id,
            },
            select: {
                id: true,
            },
        });

        if (!subagentUser) {
            throw new UserNotFoundException(
                "Subagent not found",
                HttpStatus.NOT_FOUND
            );
        }

        const userCommissions = await this.prisma.userCommission.findMany({
            where: {
                OR: [{ userId: subagentUser.id }, { userId: user.id }],
            },
            select: {
                userId: true,
                percentage: true,
                billServiceSlug: true,
                subAgentMdMeterCapAmount: true,
                billService: {
                    select: {
                        name: true,
                        slug: true,
                        type: true,
                    },
                },
            },
        });

        const groupedCommissions = groupBy("billServiceSlug", userCommissions);

        const result: ListSubagentCommission[] = groupedCommissions
            .map((groupedCommission): ListSubagentCommission => {
                const subagentCommission = groupedCommission.find(
                    (p) => p.userId == subagentUser.id
                );
                if (!subagentCommission) {
                    return;
                }

                const merchantCommission = groupedCommission.find(
                    (p) => p.userId == user.id
                );
                if (!merchantCommission) {
                    return;
                }

                const isIE =
                    subagentCommission.billService.slug ==
                    BillServiceSlug.IKEJA_ELECTRIC;

                return {
                    baseCommission: merchantCommission.percentage,
                    name: subagentCommission.billService.name,
                    slug: subagentCommission.billServiceSlug,
                    subagentCommission: subagentCommission.percentage,
                    type: subagentCommission.billService.type,
                    cap:
                        subagentCommission.billService.type ==
                        BillType.ELECTRICITY
                            ? computeCap(subagentCommission.percentage)
                            : null,
                    baseCap:
                        merchantCommission.billService.type ==
                        BillType.ELECTRICITY
                            ? computeCap(merchantCommission.percentage)
                            : null,
                    baseMdCapAmount: isIE
                        ? AGENT_MD_METER_COMMISSION_CAP_AMOUNT
                        : null,
                    mdCapAmount: isIE
                        ? subagentCommission.subAgentMdMeterCapAmount
                        : null,
                };
            })
            .filter((bc) => !!bc == true);

        return buildResponse({
            message: "Bill service commissions successfully retrieved",
            data: result,
        });
    }

    async merchantUpdateSubagentCommission(
        subagentId: number,
        options: UpdateSubagentCommissionDto,
        user: User
    ) {
        const subagentUser = await this.prisma.user.findFirst({
            where: {
                id: subagentId,
                createdById: user.id,
            },
            select: {
                id: true,
            },
        });

        if (!subagentUser) {
            throw new UserNotFoundException(
                "Subagent not found",
                HttpStatus.NOT_FOUND
            );
        }

        //validate
        const subagentDbCommission =
            await this.prisma.userCommission.findUnique({
                where: {
                    userId_billServiceSlug: {
                        billServiceSlug: options.billServiceSlug,
                        userId: subagentId,
                    },
                },
            });
        const merchantDbCommission =
            await this.prisma.userCommission.findUnique({
                where: {
                    userId_billServiceSlug: {
                        billServiceSlug: options.billServiceSlug,
                        userId: user.id,
                    },
                },
            });

        if (!subagentDbCommission) {
            throw new BillCommissionException(
                "Bill commission not previously assigned to the subagent",
                HttpStatus.NOT_FOUND
            );
        }
        if (!merchantDbCommission) {
            throw new BillCommissionException(
                "Bill commission not found on merchant account",
                HttpStatus.NOT_FOUND
            );
        }
        if (options.commission > merchantDbCommission.percentage) {
            throw new BillCommissionException(
                "Your subagent commission must not be greater than your commission",
                HttpStatus.NOT_FOUND
            );
        }

        await this.prisma.userCommission.update({
            where: {
                userId_billServiceSlug: {
                    userId: subagentId,
                    billServiceSlug: options.billServiceSlug,
                },
            },
            data: {
                subAgentMdMeterCapAmount:
                    options.subAgentMdMeterCapAmount ??
                    subagentDbCommission.subAgentMdMeterCapAmount,
                percentage:
                    options.commission ?? subagentDbCommission.percentage,
            },
        });

        return buildResponse({
            message: "commission successfully updated",
        });
    }

    async merchantDeleteSubagentCommission(
        subagentId: number,
        options: DeleteSubagentCommissionDto,
        user: User
    ) {
        const subagentUser = await this.prisma.user.findFirst({
            where: {
                id: subagentId,
                createdById: user.id,
            },
            select: {
                id: true,
            },
        });

        if (!subagentUser) {
            throw new UserNotFoundException(
                "Subagent not found",
                HttpStatus.NOT_FOUND
            );
        }
        const subagentDbCommission =
            await this.prisma.userCommission.findUnique({
                where: {
                    userId_billServiceSlug: {
                        billServiceSlug: options.billServiceSlug,
                        userId: subagentId,
                    },
                },
            });

        if (!subagentDbCommission) {
            throw new BillCommissionException(
                "Bill commission not found",
                HttpStatus.NOT_FOUND
            );
        }

        await this.prisma.userCommission.delete({
            where: {
                userId_billServiceSlug: {
                    userId: subagentId,
                    billServiceSlug: options.billServiceSlug,
                },
            },
        });

        return buildResponse({
            message: "commission successfully deleted",
        });
    }

    async fetchMerchantCommission(userId: number) {
        const merchant = await this.prisma.user.findFirst({
            where: {
                id: userId,
            },
        });

        if (!merchant) {
            throw new UserNotFoundException(
                "Merchant not found",
                HttpStatus.NOT_FOUND
            );
        }

        const merchantCommission = await this.prisma.userCommission.findMany({
            where: {
                userId: userId,
            },
            select: {
                userId: true,
                percentage: true,
                billServiceSlug: true,
                billService: {
                    select: {
                        name: true,
                        baseCommissionPercentage: true,
                    },
                },
            },
        });

        const groupedCommissions = groupBy(
            "billServiceSlug",
            merchantCommission
        );

        return buildResponse({
            message: "Merchant commission successfully retrieved",
            data: groupedCommissions,
        });
    }
}
