import { AuthGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import {
    Controller,
    Get,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserModel } from "@prisma/client";
import { TransactionHistoryDto, VerifyTransactionDto } from "../../dtos";
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
}
