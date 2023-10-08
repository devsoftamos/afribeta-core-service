import { BillType } from "@prisma/client";

export interface ListMerchantCommission {
    commission: number;
    cap?: number;
    type: BillType;
    name: string;
    slug: string;
    commissionMd?: number;
    capMd?: number;
}

export interface ListAgencyCommission {
    baseCommission?: number;
    agentCommission: number;
    type: BillType;
    name: string;
    slug: string;
}
