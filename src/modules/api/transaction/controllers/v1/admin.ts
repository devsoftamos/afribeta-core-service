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

    @Get("payout")
    async viewPayoutHistory(
        @Query(ValidationPipe) viewPayoutStatusDto: ViewPayoutStatusDto,
        @User() user: UserModel
    ) {
        return await this.transactionService.viewPayouts(
            viewPayoutStatusDto,
            user
        );
    }

    @Patch("payout/authorize")
    async updatePayoutStatus(
        @Body(ValidationPipe) updatePayoutStatusDto: UpdatePayoutStatusDto,
        @User() user: UserModel
    ) {
        return await this.transactionService.updatePayoutStatus(
            updatePayoutStatusDto,
            user
        );
    }

    @Get("payout/:reference")
    async getPayoutDetails(
        @Param("reference", ValidationPipe) reference: string,
        @User() user: UserModel
    ) {
        return await this.transactionService.viewPayoutDetails(reference, user);
    }
}
