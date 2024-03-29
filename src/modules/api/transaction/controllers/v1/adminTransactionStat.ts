import { AuthGuard } from "@/modules/api/auth/guard";
import {
    Controller,
    Get,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { TransactionStatService } from "../../services/transactionStat";
import { SuccessfulTransactionsDto } from "../../dtos";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/transaction/statistics",
})
export class AdminTransactionStatController {
    constructor(
        private readonly transactionStatService: TransactionStatService
    ) {}

    @Get("bill/success")
    async GetSuccessfulBillPaymentTransactions(
        @Query(ValidationPipe)
        successfulTransactionsDto: SuccessfulTransactionsDto
    ) {
        return await this.transactionStatService.successfulTransactionsOnBillPayment(
            successfulTransactionsDto
        );
    }

    @Get()
    async GetTotalTransactions(
        @Query(ValidationPipe)
        successfulTransactionsDto: SuccessfulTransactionsDto
    ) {
        return await this.transactionStatService.fetchTotalTransactions(
            successfulTransactionsDto
        );
    }
}
