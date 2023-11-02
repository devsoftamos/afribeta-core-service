import { PrismaService } from "@/modules/core/prisma/services";
import { Prisma } from "@prisma/client";
import { CreateRoleDto, FetchRolesDto } from "../dtos";
import { buildResponse } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import slugify from "slugify";
import { DuplicateRoleException, RoleNotFoundException } from "../errors";

@Injectable()
export class AccessControlService {
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

    private async validatePermission(permission: Array<number>) {
        const permissions = await this.prisma.permission.findMany({
            where: {
                id: {
                    in: permission,
                },
            },
        });

        return permissions.length === permission.length;
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

        const slug = slugify(options.roleName, { lower: true });

        const permissions = options.permissions;

        const permissionExists = await this.validatePermission(permissions);
        if (!permissionExists) {
            throw new RoleNotFoundException(
                "Permission not found",
                HttpStatus.BAD_REQUEST
            );
        }

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

            const roleId = role.id;

            for (const permission of permissions) {
                await tx.rolePermission.create({
                    data: {
                        roleId: roleId,
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
