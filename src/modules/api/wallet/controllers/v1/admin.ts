import { Controller, UseGuards, Get } from "@nestjs/common";
import { WalletService } from "../../services";
import { AuthGuard, EnabledAccountGuard } from "@/modules/api/auth/guard";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import * as Ability from "@/modules/core/ability";

@UseGuards(AuthGuard, EnabledAccountGuard)
@Controller({
    path: "admin/wallet",
})
export class AdminWalletController {
    constructor(private readonly walletService: WalletService) {}

    @Get("overview/balance")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadUsersWalletSummaryAbility())
    async openingBalance() {
        return this.walletService.getTotalWalletBalance();
    }

    @Get("vending/balance")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadThirdPartyWalletBalanceAbility())
    async getOrgWalletBalance() {
        return this.walletService.getOrgWalletBalance();
    }
}
