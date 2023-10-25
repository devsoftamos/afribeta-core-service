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
import { TransactionStatService } from "../../services/transactionStat";
import { SuccessfulTransactionsDto } from "../../dtos";

@UseGuards(AuthGuard)
@Controller({
    path: "transaction/statistics",
})
export class TransactionStatController {
    constructor(
        private readonly transactionStatService: TransactionStatService
    ) {}

    @Get("success")
    async GetSuccessfulTransactions(
        @Query(ValidationPipe)
        successfulTransactionsDto: SuccessfulTransactionsDto,
        @User() user: UserModel
    ) {
        return await this.transactionStatService.successfulTransactions(
            successfulTransactionsDto,
            user
        );
    }

    @Get("merchant/commission")
    async GetMerchantTotalCommission(
        @Query(ValidationPipe)
        successfulTransactionsDto: SuccessfulTransactionsDto,
        @User() user: UserModel
    ) {
        return await this.transactionStatService.fetchMerchantTotalCommission(
            successfulTransactionsDto,
            user
        );
    }

    @Get()
    async GetTotalTransactions(
        @Query(ValidationPipe)
        successfulTransactionsDto: SuccessfulTransactionsDto
    ) {
        return this.transactionStatService.fetchTotalTransactions(
            successfulTransactionsDto
        );
    }

    @Get("admin/commission")
    async GetTotalCommission(
        @Query(ValidationPipe)
        successfulTransactionsDto: SuccessfulTransactionsDto
    ) {
        return this.transactionStatService.fetchTotalCommission(
            successfulTransactionsDto
        );
    }
}
