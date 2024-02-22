import { Controller, UseGuards, Get } from "@nestjs/common";
import { WalletService } from "../../services";
import { AuthGuard, EnabledAccountGuard } from "@/modules/api/auth/guard";

@UseGuards(AuthGuard, EnabledAccountGuard)
@Controller({
    path: "admin/wallet",
})
export class AdminWalletController {
    constructor(private readonly walletService: WalletService) {}

    @Get("overview/balance")
    async openingBalance() {
        return this.walletService.getTotalWalletBalance();
    }

    @Get("vending/balance")
    async getOrgWalletBalance() {
        return this.walletService.getOrgWalletBalance();
    }
}
