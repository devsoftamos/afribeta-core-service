import { Prisma } from "@prisma/client";

export const roles: Prisma.RoleUncheckedCreateInput[] = [
    {
        name: "Agent",
        slug: "agent",
    },
    {
        name: "Customer",
        slug: "customer",
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
        name: "Admin",
        slug: "admin",
    },
    {
        name: "Sub Agent",
        slug: "sub-agent",
    },
    {
        name: "Marketer",
        slug: "marketer",
    },
    {
        name: "Marketer Head",
        slug: "marketer-head",
    },
    {
        name: "Accountant",
        slug: "accountant",
    },
    {
        name: "Customer Care",
        slug: "customer-care",
    },
];
