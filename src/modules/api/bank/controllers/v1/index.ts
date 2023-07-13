import { AuthGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import {
    Controller,
    Get,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserEntity } from "@prisma/client";
import { GetPaymentProviderBanksDto, ResolveBankAccountDto } from "../../dtos";
import { BankService } from "../../services";

@Controller({
    path: "bank",
})
export class BankController {
    constructor(private readonly bankService: BankService) {}

    @Get()
    async getBankList(
        @Query(ValidationPipe)
        getPaymentProviderBanksDto: GetPaymentProviderBanksDto
    ) {
        return await this.bankService.getBankList(getPaymentProviderBanksDto);
    }

    @UseGuards(AuthGuard)
    @Get("virtual-account")
    async getVirtualBankAccount(@User() user: UserEntity) {
        return await this.bankService.getVirtualBankAccounts(user);
    }

    @Get("resolve")
    async resolveBankAccount(
        @Query(ValidationPipe)
        resolveBankAccountDto: ResolveBankAccountDto
    ) {
        return await this.bankService.resolveBankAccount(resolveBankAccountDto);
    }
}
