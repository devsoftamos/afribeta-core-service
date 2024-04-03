import { AuthGuard } from "@/modules/api/auth/guard";
import {
    Controller,
    Get,
    Patch,
    Post,
    Param,
    Query,
    Body,
    UseGuards,
    ValidationPipe,
    ParseIntPipe,
} from "@nestjs/common";
import { TransactionService } from "../../services";
import {
    AdminTransactionHistoryDto,
    CustomerTransactionHistoryDto,
    FetchRecommendedPayoutDto,
    MerchantTransactionHistoryDto,
    TransactionHistoryDto,
    UpdatePayoutStatusDto,
    ViewPayoutStatusDto,
} from "../../dtos";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import * as Ability from "@/modules/core/ability";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/transaction",
})
export class AdminTransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Get("merchant")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadTransactionAbility())
    async merchantTransactionHistory(
        @Query(ValidationPipe)
        merchantTransactionHistory: MerchantTransactionHistoryDto
    ) {
        return await this.transactionService.merchantTransactionHistory(
            merchantTransactionHistory
        );
    }

    @Get("payout")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadPayoutAbility())
    async viewPayoutHistory(
        @Query(ValidationPipe) viewPayoutStatusDto: ViewPayoutStatusDto
    ) {
        return await this.transactionService.viewPayoutRequests(
            viewPayoutStatusDto
        );
    }

    @Patch("payout/authorize")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.AuthorizePayoutAbility())
    async updatePayoutStatus(
        @Body(ValidationPipe) updatePayoutStatusDto: UpdatePayoutStatusDto
    ) {
        return await this.transactionService.updatePayoutStatus(
            updatePayoutStatusDto
        );
    }

    @Get("payout/:id")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadPayoutAbility())
    async getPayoutDetails(@Param("id", ParseIntPipe) id: number) {
        return await this.transactionService.viewPayoutDetails(id);
    }

    @Get("recent")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadTransactionAbility())
    async getRecentTransactions(
        @Query(ValidationPipe) transactionHistoryDto: TransactionHistoryDto
    ) {
        return await this.transactionService.adminRecentTransactions(
            transactionHistoryDto
        );
    }

    @Post("payout/recommend/:id")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.FundWithdrawRecommendAbility())
    async recommendPayout(@Param("id", ParseIntPipe) id: number) {
        return await this.transactionService.recommendPayout(id);
    }

    @Get()
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadTransactionAbility())
    async getAllTransactions(
        @Query(ValidationPipe)
        transactionHistoryDto: AdminTransactionHistoryDto
    ) {
        return await this.transactionService.getAllTransactions(
            transactionHistoryDto
        );
    }

    @Get("payout/recommended/list")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadPayoutAbility())
    async GetRecommendedPayouts(
        @Query(ValidationPipe)
        fetchRecommendedPayoutDto: FetchRecommendedPayoutDto
    ) {
        return await this.transactionService.fetchRecommendedPayouts(
            fetchRecommendedPayoutDto
        );
    }

    @Get("report")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadReportAbility())
    async getAdminReport(
        @Query(ValidationPipe) transactionHistoryDto: TransactionHistoryDto
    ) {
        return this.transactionService.adminTransactionReport(
            transactionHistoryDto
        );
    }

    @Get("single/:id")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadTransactionAbility())
    async getTransaction(@Param("id", ParseIntPipe) id: number) {
        return await this.transactionService.fetchTransactionDetails(id);
    }

    @Get("customer/history")
    async CustomerTransactionHistory(
        @Query(ValidationPipe)
        customerTransactionHistoryDto: CustomerTransactionHistoryDto
    ) {
        return await this.transactionService.fetchCustomerTransactionHistory(
            customerTransactionHistoryDto
        );
    }

    @Get("user")
    async UserTransactionHistory(
        @Query(ValidationPipe)
        userTransactionHistoryDto: UserTransactionHistoryDto
    ) {
        return await this.transactionService.getUserTransactions(
            userTransactionHistoryDto
        );
    }
}
