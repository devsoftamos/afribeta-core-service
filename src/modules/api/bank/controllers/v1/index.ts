import { Controller, Get, Query, ValidationPipe } from "@nestjs/common";
import { GetPaymentProviderBanksDto } from "../../dtos";
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
}
