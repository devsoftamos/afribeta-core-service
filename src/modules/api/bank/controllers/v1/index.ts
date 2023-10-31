import { AuthGuard, IsEnabledGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import {
    CreateBankAccountAbility,
    ReadBankAccountAbility,
} from "@/modules/core/ability";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
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

    @UseGuards(AuthGuard, IsEnabledGuard)
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

    @Post()
    @UseGuards(AuthGuard, IsEnabledGuard, AbilitiesGuard)
    @CheckAbilities(new CreateBankAccountAbility())
    async createBank(
        @Body(ValidationPipe) createBankDto: CreateBankDto,
        @User() user: UserModel
    ) {
        return await this.bankService.createBank(createBankDto, user);
    }

    @Get("account")
    @UseGuards(AuthGuard, IsEnabledGuard, AbilitiesGuard)
    @CheckAbilities(new ReadBankAccountAbility())
    async getBankAccount(@User() user: UserModel) {
        return await this.bankService.getBankAccount(user);
    }
}
