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
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import * as Ability from "@/modules/core/ability";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/transaction/statistics",
})
export class AdminTransactionStatController {
    constructor(
        private readonly transactionStatService: TransactionStatService
    ) {}

    @Get()
    // @UseGuards(AbilitiesGuard)
    // @CheckAbilities(new Ability.ReadTransactionAbility())
    async GetTotalTransactions(
        @Query(ValidationPipe)
        successfulTransactionsDto: SuccessfulTransactionsDto
    ) {
        return await this.transactionStatService.fetchTotalTransactions(
            successfulTransactionsDto
        );
    }

    @Get("period")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadTransactionAbility())
    async getAllTransactionStat(
        @Query(ValidationPipe)
        queryDto: AllTransactionStatDto
    ) {
        return await this.transactionStatService.getAllTransactionStat(
            queryDto
        );
    }
}
