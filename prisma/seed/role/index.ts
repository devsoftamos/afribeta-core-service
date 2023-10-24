import { Prisma } from "@prisma/client";

export const roles: Prisma.RoleUncheckedCreateInput[] = [
    {
        name: "Customer",
        slug: "customer",
    },
    {
        name: "Sub Agent",
        slug: "sub-agent",
    },
    {
        name: "Agent",
        slug: "agent",
    },
    {
        name: "Merchant",
        slug: "merchant",
    },
    {
        name: "Super Admin",
        slug: "super-admin",
    },
    {
        name: "Marketer",
        slug: "marketer",
        isAppDefault: false,
    },
    {
        name: "Head of Marketing",
        slug: "head-of-marketing",
        isAppDefault: false,
    },
    {
        name: "Accountant",
        slug: "accountant",
        isAppDefault: false,
    },
    {
        name: "Customer Care",
        slug: "customer-care",
        isAppDefault: false,
    },
];
