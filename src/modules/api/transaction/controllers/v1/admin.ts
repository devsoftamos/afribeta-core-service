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
    MerchantTransactionHistoryDto,
    TransactionHistoryDto,
    UpdatePayoutStatusDto,
    ViewPayoutStatusDto,
} from "../../dtos";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/transaction",
})
export class AdminTransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Get("merchant")
    async merchantTransactionHistory(
        @Query(ValidationPipe)
        merchantTransactionHistory: MerchantTransactionHistoryDto
    ) {
        return await this.transactionService.merchantTransactionHistory(
            merchantTransactionHistory
        );
    }

    @Get("payout")
    async viewPayoutHistory(
        @Query(ValidationPipe) viewPayoutStatusDto: ViewPayoutStatusDto
    ) {
        return await this.transactionService.viewPayoutRequests(
            viewPayoutStatusDto
        );
    }

    @Patch("payout/authorize")
    async updatePayoutStatus(
        @Body(ValidationPipe) updatePayoutStatusDto: UpdatePayoutStatusDto
    ) {
        return await this.transactionService.updatePayoutStatus(
            updatePayoutStatusDto
        );
    }

    @Get("payout/:id")
    async getPayoutDetails(@Param("id", ParseIntPipe) id: number) {
        return await this.transactionService.viewPayoutDetails(id);
    }

    @Get("recent")
    async getrecentTransactions(
        @Query(ValidationPipe) transactionHistoryDto: TransactionHistoryDto
    ) {
        return await this.transactionService.adminRecentTransactions(
            transactionHistoryDto
        );
    }

    @Post("payout/:id")
    async recommendPyout(@Param("id", ParseIntPipe) id: number) {
        return await this.transactionService.recommendPayout(id);
    }
}
