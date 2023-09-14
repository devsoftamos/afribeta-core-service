import { AuthGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import {
    Controller,
    Get,
    Patch,
    Query,
    Body,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserModel } from "@prisma/client";
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
        merchantTransactionHistory: MerchantTransactionHistoryDto,
        @User() user: UserModel
    ) {
        return await this.transactionService.merchantTransactionHistory(
            merchantTransactionHistory,
            user
        );
    }

    @Get("payouts")
    async viewPayoutHistory(
        @Query(ValidationPipe) viewPayoutStatusDto: ViewPayoutStatusDto,
        @User() user: UserModel
    ) {
        return await this.transactionService.viewPayouts(
            viewPayoutStatusDto,
            user
        );
    }

    @Patch("update/payout-status")
    async updatePayoutStatus(
        @Body(ValidationPipe) updatePayoutStatusDto: UpdatePayoutStatusDto,
        @User() user: UserModel
    ) {
        return await this.transactionService.updatePayoutStatus(
            updatePayoutStatusDto,
            user
        );
    }
}
