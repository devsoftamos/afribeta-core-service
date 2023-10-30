import { PrismaService } from "@/modules/core/prisma/services";
import { Prisma } from "@prisma/client";
import { CreateRoleDto, FetchRolesDto } from "../dtos";
import { buildResponse } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import { DuplicateRoleException } from "../errors";

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
            queryOptions.where.name = { search: options.roleName };
        }

        const roles = await this.prisma.role.findMany(queryOptions);

        return buildResponse({
            message: "Roles retrieved successfully",
            data: roles,
        });
    }

    private async slugifyString(string) {
        return string
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    }

    async createRoles(options: CreateRoleDto) {
        const roleExists = await this.prisma.role.findUnique({
            where: {
                name: options.roleName,
            },
        });
        if (roleExists) {
            throw new DuplicateRoleException(
                "A role with this name already exists",
                HttpStatus.BAD_REQUEST
            );
        }

        const slug = await this.slugifyString(options.roleName);

        const createRoleOptions: Prisma.RoleUncheckedCreateInput = {
            name: options.roleName,
            slug: slug,
        };

        const role = await this.prisma.role.create({
            data: createRoleOptions,
            select: {
                id: true,
            },
        });

        const roleId = role.id;
        const permissions = options.permissions;

        for (const permission of permissions) {
            await this.prisma.rolePermission.create({
                data: {
                    roleId: roleId,
                    permissionId: permission,
                },
            });
        }

        return buildResponse({
            message: "Role created successfully",
        });
    }
}
