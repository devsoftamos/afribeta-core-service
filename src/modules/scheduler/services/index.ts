import { WalletService } from "@/modules/api/wallet/services";
import { PrismaService } from "@/modules/core/prisma/services";
import { Inject, Injectable, forwardRef } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class SchedulerService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => WalletService))
        private walletService: WalletService
    ) {}
    @Cron("59 23 * * *", {
        timeZone: "Africa/Lagos",
    })
    async aggregateWalletOpeningBalance() {
        const mainWalletBalance = (
            await this.walletService.aggregateTotalWalletBalance()
        ).mainBalance;

        const mainCommissionBalance = (
            await this.walletService.aggregateTotalWalletBalance()
        ).commissionBalance;

        await this.prisma.walletOpeningBalance.upsert({
            where: {
                id: 1,
            },
            update: {
                main: mainWalletBalance,
                commission: mainCommissionBalance,
            },
            create: {
                main: mainWalletBalance,
                commission: mainCommissionBalance,
            },
        });
    }
}
