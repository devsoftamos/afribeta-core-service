import { createObjectCsvWriter } from "csv-writer";
import { PrismaService } from "./db";
import { join } from "path";

export async function exportMerchantBalance(prisma: PrismaService) {
    const path = join(__dirname, "../script/files/merchant.csv");

    const csvWriter = createObjectCsvWriter({
        path: path,
        header: [
            { id: "email", title: "email" },
            { id: "walletBalance", title: "walletBalance" },
            { id: "commissionBalance", title: "commissionBalance" },
        ],
    });

    const merchants = await prisma.user.findMany({
        where: {
            id: { lte: 4 },
        },
        select: {
            email: true,
        },
    });

    const data = merchants.map(async (v) => {
        return {
            email: v.email,
            walletBalance: Math.floor(Math.random() * 8000),
            commissionBalance: Math.floor(Math.random() * 2000),
        };
    });

    const csvData = await Promise.all(data);

    await csvWriter.writeRecords(csvData);
}

export async function exportCommission(prisma: PrismaService) {
    const path = join(__dirname, "../script/files/commission.csv");

    const csvWriter = createObjectCsvWriter({
        path: path,
        header: [
            { id: "billService", title: "billService" },
            { id: "baseRate", title: "baseRate" },
            { id: "defaultAgentRate", title: "defaultAgentRate" },
        ],
    });

    const billServices = await prisma.billService.findMany({
        select: {
            name: true,
            baseCommissionPercentage: true,
            agentDefaultCommissionPercent: true,
        },
    });

    const data = billServices.map((v) => {
        return {
            billService: v.name,
            baseRate: v.baseCommissionPercentage,
            defaultAgentRate: v.agentDefaultCommissionPercent,
        };
    });

    await csvWriter.writeRecords(data);
}
