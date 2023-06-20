import { Controller, Get, Query, ValidationPipe } from "@nestjs/common";
import { VerifyTransactionDto } from "../../dtos";
import { TransactionService } from "../../services";

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
}
