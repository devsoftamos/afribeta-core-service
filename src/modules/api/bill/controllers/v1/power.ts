import { AuthGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserModel } from "@prisma/client";
import { PaymentReferenceDto } from "../../dtos";
import { GetMeterInfoDto, PurchasePowerDto } from "../../dtos/power";
import { InitializeBillPaymentGuard } from "../../guard";
import { PowerBillService } from "../../services/power";

@UseGuards(AuthGuard)
@Controller({
    path: "bill/power",
})
export class PowerBillController {
    constructor(private readonly powerBillService: PowerBillService) {}

    @Get()
    async getElectricDiscos() {
        return await this.powerBillService.getElectricDiscos();
    }

    @HttpCode(HttpStatus.OK)
    @Post("initialize-power-purchase")
    @UseGuards(InitializeBillPaymentGuard)
    async initializePowerPurchase(
        @Body(ValidationPipe)
        purchasePowerDto: PurchasePowerDto,
        @User() user: UserModel
    ) {
        return await this.powerBillService.initializePowerPurchase(
            purchasePowerDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("wallet-payment")
    async walletPayment(
        @Body(ValidationPipe)
        walletPowerPaymentDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.powerBillService.walletPayment(
            walletPowerPaymentDto,
            user
        );
    }

    @Get("verify/:reference")
    async getPowerPurchaseStatus(
        @Param(ValidationPipe)
        getPowerPurchaseStatusDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.powerBillService.verifyPowerPurchase(
            getPowerPurchaseStatusDto,
            user
        );
    }

    @Get("meter")
    async getMeterInfo(
        @Query(ValidationPipe) getMeterInfoDto: GetMeterInfoDto
    ) {
        return await this.powerBillService.getMeterInfo(getMeterInfoDto);
    }
}
