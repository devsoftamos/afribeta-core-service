import { Prisma } from "@prisma/client";

export const roles: Prisma.RoleUncheckedCreateInput[] = [
    {
        name: "Customer",
        slug: "customer",
        isAdmin: false,
    },
    {
        name: "Sub Agent",
        slug: "sub-agent",
        isAdmin: false,
    },
    {
        name: "Agent",
        slug: "agent",
        isAdmin: false,
    },
    {
        name: "Merchant",
        slug: "merchant",
        isAdmin: false,
    },

    //admins
    {
        name: "Super Admin",
        slug: "super-admin",
    },
    {
        name: "Marketer",
        slug: "marketer",
    },
    {
        name: "Marketing Unit Head",
        slug: "marketing-unit-head",
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
