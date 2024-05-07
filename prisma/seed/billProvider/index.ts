import { Prisma } from "@prisma/client";

export const billProviders: Prisma.BillProviderUncheckedCreateInput[] = [
    {
        name: "iRecharge",
        isActive: true,
        slug: "irecharge",
        isDefault: true,
    },
    {
        name: "Ikeja Electric",
        isActive: true,
        slug: "ikeja-electric",
    },
    {
        name: "BuyPower",
        isActive: true,
        slug: "buypower",
    },
];
