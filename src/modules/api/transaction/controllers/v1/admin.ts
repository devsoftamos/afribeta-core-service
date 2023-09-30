import { AuthGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import {
    Controller,
    Get,
    Patch,
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
}
