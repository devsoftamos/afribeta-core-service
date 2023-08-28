import { AuthGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserModel } from "@prisma/client";
import { CreateBankDto, ResolveBankAccountDto } from "../../dtos";
import { BankService } from "../../services";

@Controller({
    path: "bank",
})
export class BankController {
    constructor(private readonly bankService: BankService) {}

    @Get()
    async getBankList() {
        return await this.bankService.getBankList();
    }

    @UseGuards(AuthGuard)
    @Get("virtual-account")
    async getVirtualBankAccount(@User() user: UserModel) {
        return await this.bankService.getVirtualBankAccounts(user);
    }

    @Get("resolve")
    async resolveBankAccount(
        @Query(ValidationPipe)
        resolveBankAccountDto: ResolveBankAccountDto
    ) {
        return await this.bankService.resolveBankAccount(resolveBankAccountDto);
    }

    @UseGuards(AuthGuard)
    @Post()
    async createBank(
        @Body(ValidationPipe) createBankDto: CreateBankDto,
        @User() user: UserModel
    ) {
        return await this.bankService.createBank(createBankDto, user);
    }
}
