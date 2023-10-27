import { Prisma } from "@prisma/client";

export const rolePermissions: Prisma.RolePermissionUncheckedCreateInput[] = [
    //*****marketing******
    {
        roleId: 6, //"marketer",
        permissionId: 3, //"user.read",
    },
    {
        roleId: 6, //"marketer"
        permissionId: 4, //"account.activate_deactivate",
    },
    {
        roleId: 6, //"marketer"
        permissionId: 1, //"report.read",
    },
    {
        roleId: 6, //"marketer"
        permissionId: 2, //"user_balance.read",
    },
    {
        roleId: 6, //"marketer"
        permissionId: 6, //"transaction.read",
    },
    {
        roleId: 6,
        permissionId: 20,
    },

    //head of marketing
    {
        roleId: 7, //"marketing-unit-head",
        permissionId: 3, //"user.read",
    },
    {
        roleId: 7, //"marketing-unit-head",
        permissionId: 4, //"account.activate_deactivate",
    },

    {
        roleId: 7, //"marketing-unit-head",
        permissionId: 1, //"report.read",
    },
    {
        roleId: 7, //"marketing-unit-head",
        permissionId: 2, //"user_balance.read",
    },
    {
        roleId: 7, //"marketing-unit-head",
        permissionId: 5, //"kyc.authorize",
    },
    {
        roleId: 7, //"marketing-unit-head",
        permissionId: 6, //"transaction.read",
    },
    {
        roleId: 7,
        permissionId: 18,
    },
    {
        roleId: 7,
        permissionId: 20,
    },

    //*****accountant******* */
    {
        roleId: 8, //"accountant",
        permissionId: 2, //"user_balance.read",
    },
    {
        roleId: 8, //"accountant",
        permissionId: 3, //"user.read",
    },
    {
        roleId: 8, //"accountant",
        permissionId: 1, //"report.read",
    },
    {
        roleId: 8, //"accountant",
        permissionId: 6, //"transaction.read",
    },
    {
        roleId: 8, //"accountant",
        permissionId: 7, //"fund.withdraw.recommend",
    },
    {
        roleId: 8,
        permissionId: 20,
    },
    {
        roleId: 8, //"accountant",
        permissionId: 19, //"commission.update",
    },

    //******customer care********* */
    {
        roleId: 9, //"customer-care",
        permissionId: 2, //"user_balance.read",
    },
    {
        roleId: 9, //"customer-care",
        permissionId: 3, //"user.read",
    },
    {
        roleId: 9, //"customer-care",
        permissionId: 1, //"report.read",
    },
    {
        roleId: 9, //"customer-care",
        permissionId: 6, //"transaction.read",
    },
    {
        roleId: 9, //"customer-care",
        permissionId: 4, //"account.activate_deactivate",
    },
    {
        roleId: 9, //"customer-care",
        permissionId: 5, //"kyc.authorize",
    },
    {
        roleId: 9,
        permissionId: 20, //kyc.read
    },
    {
        roleId: 7,
        permissionId: 18, //commission.read
    },
];
