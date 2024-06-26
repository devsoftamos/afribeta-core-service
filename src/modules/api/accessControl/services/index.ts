import { PrismaService } from "@/modules/core/prisma/services";
import { Prisma } from "@prisma/client";
import { CreateRoleDto, FetchRolesDto, UpdateRoleDto } from "../dtos";
import { buildResponse, generateSlug } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    DuplicateRoleException,
    PermissionNotFoundException,
    RoleNotFoundException,
} from "../errors";

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

    async createRole(options: CreateRoleDto) {
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

        await this.validatePermission(options.permissions);
        const slug = generateSlug(options.roleName);

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
            const data = options.permissions.map((pId) => ({
                roleId: role.id,
                permissionId: pId,
            }));
            await tx.rolePermission.createMany({ data: data });
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

    async deleteRole(roleId: number) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
        });
        if (!role) {
            throw new RoleNotFoundException(
                "Role not found",
                HttpStatus.NOT_FOUND
            );
        }

        await this.prisma.role.delete({ where: { id: roleId } });

        return buildResponse({
            message: "role successfully deleted",
        });
    }

    async updateRole(roleId: number, options: UpdateRoleDto) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
        });
        if (!role) {
            throw new RoleNotFoundException(
                "Role not found",
                HttpStatus.NOT_FOUND
            );
        }

        const slug = generateSlug(options.roleName);
        const updatedRole = await this.prisma.role.update({
            where: { id: roleId },
            data: {
                name: options.roleName,
                slug: slug,
            },
        });

        return buildResponse({
            message: "role successfully updated",
            data: {
                id: updatedRole.id,
                name: updatedRole.name,
                slug: updatedRole.slug,
            },
        });
    }
}
