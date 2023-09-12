import { AuthGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import { ViewAgentAbility } from "@/modules/core/ability";
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

import { MerchantTransactionHistoryDto } from "../../dtos";
import { TransactionService } from "../../services";

@Controller({
    path: "transaction/admin",
})
export class AdminTransactionController {
    constructor(private readonly transactionService: TransactionService) {}

    @Get("merchant")
    async getMerchantTransactionHistory(
        @Query(ValidationPipe)
        merchantTransactionHistory: MerchantTransactionHistoryDto
    ) {
        return this.transactionService.merchantTransactionHistory(
            merchantTransactionHistory
        );
    }
}
