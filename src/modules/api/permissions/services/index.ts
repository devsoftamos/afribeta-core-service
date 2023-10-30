import { PrismaService } from "@/modules/core/prisma/services";
import { Prisma } from "@prisma/client";
import { buildResponse } from "@/utils";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PermissionService {
    constructor(private readonly prisma: PrismaService) {}

    async fetchPermissions() {
        const queryOptions: Prisma.PermissionFindManyArgs = {
            where: {},
            select: {
                id: true,
                name: true,
                description: true,
            },
        };

        const permissions = await this.prisma.permission.findMany(queryOptions);
        return buildResponse({
            message: "Permissions retrieved successfully",
            data: permissions,
        });
    }
}
