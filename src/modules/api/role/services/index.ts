import { PrismaService } from "@/modules/core/prisma/services";
import { Prisma } from "@prisma/client";
import { FetchRolesDto } from "../dtos";
import { buildResponse } from "@/utils";
import { Injectable } from "@nestjs/common";

@Injectable()
export class RolesService {
    constructor(private prisma: PrismaService) {}

    async fetchRoles(options: FetchRolesDto) {
        const queryOptions: Prisma.RoleFindManyArgs = {
            where: {},
            select: {
                name: true,
            },
        };

        if (options.roleName) {
            queryOptions.where.name = options.roleName;
        }

        const roles = await this.prisma.role.findMany(queryOptions);

        return buildResponse({
            message: "Roles retrieved successfully",
            data: roles,
        });
    }
}
