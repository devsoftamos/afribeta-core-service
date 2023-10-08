import { BillType } from "@prisma/client";

export interface ListAgencyCommission {
    commission: number;
    cap?: number;
    type: BillType;
    name: string;
    slug: string;
    commissionMd?: number;
    capMd?: number;
}
