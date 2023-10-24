import { Prisma } from "@prisma/client";

export const rolePermissions: Prisma.RolePermissionUncheckedCreateInput[] = [
    //*****marketing******
    {
        roleId: 6,
        permissionId: 3,
    },
    {
        roleId: 6,
        permissionId: 4,
    },
    {
        roleId: 6,
        permissionId: 1,
    },
    //head of marketing
    {
        roleId: 7,
        permissionId: 3,
    },
    {
        roleId: 7,
        permissionId: 4,
    },

    {
        roleId: 7,
        permissionId: 5,
    },
    {
        roleId: 7,
        permissionId: 1,
    },

    //*****accountant******* */
    {
        roleId: 8,
        permissionId: 2,
    },
    {
        roleId: 8,
        permissionId: 1,
    },
    {
        roleId: 8,
        permissionId: 7,
    },
    {
        roleId: 8,
        permissionId: 3,
    },

    //******customer care********* */
    {
        roleId: 9,
        permissionId: 3,
    },
    {
        roleId: 9,
        permissionId: 4,
    },
    {
        roleId: 9,
        permissionId: 5,
    },
    {
        roleId: 9,
        permissionId: 6,
    },
    {
        roleId: 9,
        permissionId: 1,
    },
];
