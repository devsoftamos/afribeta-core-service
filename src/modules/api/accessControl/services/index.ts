import { PrismaService } from "@/modules/core/prisma/services";
import { Prisma } from "@prisma/client";
import { CreateRoleDto, FetchRolesDto } from "../dtos";
import { buildResponse, generateSlug } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import { DuplicateRoleException, PermissionNotFoundException } from "../errors";

@Injectable()
export class AccessControlService {
    constructor(private prisma: PrismaService) {}

    async fetchRoles(options: FetchRolesDto) {
        const queryOptions: Prisma.RoleFindManyArgs = {
            where: {
                isAdmin: true,
            },
            select: {
                id: true,
                name: true,
            },
        };

        if (options.searchName) {
            queryOptions.where.name = { search: options.searchName };
        }

        const roles = await this.prisma.role.findMany(queryOptions);

        return buildResponse({
            message: "Roles retrieved successfully",
            data: roles,
        });
    }

    private async validatePermission(permission: number[]) {
        const count = await this.prisma.permission.count({
            where: {
                id: {
                    in: permission,
                },
            },
        });

        if (count !== permission.length) {
            throw new PermissionNotFoundException(
                "At least one permission in the provided array is invalid",
                HttpStatus.BAD_REQUEST
            );
        }
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

        const slug = generateSlug(options.roleName);
        await this.validatePermission(options.permissions);

        const createRoleOptions: Prisma.RoleUncheckedCreateInput = {
            name: options.roleName,
            slug: slug,
        };

        await this.prisma.$transaction(async (tx) => {
            const role = await tx.role.create({
                data: createRoleOptions,
                select: {
                    id: true,
                },
            });

            for (const permission of options.permissions) {
                await tx.rolePermission.create({
                    data: {
                        roleId: role.id,
                        permissionId: permission,
                    },
                });
            }
        });

        return buildResponse({
            message: "Role created successfully",
        });
    }

    async fetchPermissions() {
        const queryOptions: Prisma.PermissionFindManyArgs = {
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
