import { AuthGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import { ViewSubAgentAbility } from "@/modules/core/ability";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import {
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserModel } from "@prisma/client";
import {
    TransactionHistoryDto,
    VerifyTransactionDto,
    SuccessfulTransactionsDto,
} from "../../dtos";
import { TransactionService } from "../../services";

@UseGuards(AuthGuard)
@Controller({
    path: "transaction",
})
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Get("verify")
    async verifyTransaction(
        @Query(ValidationPipe) verifyTransactionDto: VerifyTransactionDto
    ) {
        return await this.transactionService.verifyTransaction(
            verifyTransactionDto
        );
    }

    @Get("history")
    async transactionHistory(
        @Query(ValidationPipe) transactionHistoryDto: TransactionHistoryDto,
        @User() user: UserModel
    ) {
        return await this.transactionService.transactionHistory(
            transactionHistoryDto,
            user
        );
    }

    @Get("agent/:id/history")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new ViewSubAgentAbility())
    async MerchantAgentTransactionHistory(
        @Query(ValidationPipe) transactionHistoryDto: TransactionHistoryDto,
        @User() user: UserModel,
        @Param("id", ParseIntPipe) id: number
    ) {
        return await this.transactionService.viewOwnAgentTransactionHistory(
            transactionHistoryDto,
            user,
            id
        );
    }

    @Get("successful/count")
    async GetSuccessfulTransactions(
        @Query(ValidationPipe)
        successfulTransactionsDto: SuccessfulTransactionsDto,
        @User() user: UserModel
    ) {
        return await this.transactionService.successfulTransactions(
            successfulTransactionsDto,
            user
        );
    }
}
