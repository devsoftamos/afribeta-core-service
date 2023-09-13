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
import { TransactionService } from "../../services";
import { MerchantTransactionHistoryDto } from "../../dtos";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/transaction",
})

export class AdminTransactionController{

    constructor(private readonly transactionService: TransactionService ){}

    @Get("merchant")
    async merchantTransactionHistory(
        @Query(ValidationPipe) merchantTransactionHistory: MerchantTransactionHistoryDto
    ) {
        return await this.transactionService.merchantTransactionHistory(
            merchantTransactionHistory
        );
    }

}