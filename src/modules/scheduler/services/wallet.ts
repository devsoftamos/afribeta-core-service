import { WalletService } from "@/modules/api/wallet/services";
import { PrismaService } from "@/modules/core/prisma/services";
import { Cron } from "@nestjs/schedule";
import { Inject, Injectable, forwardRef } from "@nestjs/common";

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
        const retrieveWalletOpeningBalance =
            await this.walletService.aggregateTotalWalletBalance();

        await this.prisma.walletOpeningBalance.upsert({
            where: {
                id: 1,
            },
            update: {
                main: retrieveWalletOpeningBalance.mainBalance,
                commission: retrieveWalletOpeningBalance.commissionBalance,
            },
            create: {
                main: retrieveWalletOpeningBalance.mainBalance,
                commission: retrieveWalletOpeningBalance.commissionBalance,
            },
        });
    }
}
