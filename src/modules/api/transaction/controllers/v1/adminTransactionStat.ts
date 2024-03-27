import { AuthGuard } from "@/modules/api/auth/guard";
import {
    Controller,
    Get,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { TransactionStatService } from "../../services/transactionStat";
import { AllTransactionStatDto, SuccessfulTransactionsDto } from "../../dtos";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/transaction/statistics",
})
export class AdminTransactionStatController {
    constructor(
        private readonly transactionStatService: TransactionStatService
    ) {}

    @Get()
    async GetTotalTransactions(
        @Query(ValidationPipe)
        successfulTransactionsDto: SuccessfulTransactionsDto
    ) {
        return await this.transactionStatService.fetchTotalTransactions(
            successfulTransactionsDto
        );
    }

    @Get("period")
    async getAllTransactionStat(
        @Query(ValidationPipe)
        queryDto: AllTransactionStatDto
    ) {
        return await this.transactionStatService.getAllTransactionStat(
            queryDto
        );
    }
}
