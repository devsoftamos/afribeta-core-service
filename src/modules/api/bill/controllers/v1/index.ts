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
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserModel } from "@prisma/client";
import {
    GetPowerPurchaseStatusDto,
    PurchasePowerDto,
    WalletPowerPaymentDto,
} from "../../dtos";
import { PowerBillService } from "../../services/power";

@UseGuards(AuthGuard)
@Controller({
    path: "bill",
})
export class BillController {
    constructor(private readonly powerBillService: PowerBillService) {}

    @Get("power")
    async getElectricDiscos() {
        return await this.powerBillService.getElectricDiscos();
    }

    @HttpCode(HttpStatus.OK)
    @Post("power/initialize-power-purchase")
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
    @Post("power/wallet-payment")
    async walletPayment(
        @Body(ValidationPipe)
        walletPowerPaymentDto: WalletPowerPaymentDto,
        @User() user: UserModel
    ) {
        return await this.powerBillService.walletPayment(
            walletPowerPaymentDto,
            user
        );
    }

    @Get("power/status/:reference")
    async getPowerPurchaseStatus(
        @Param(ValidationPipe)
        getPowerPurchaseStatusDto: GetPowerPurchaseStatusDto,
        @User() user: UserModel
    ) {
        return await this.powerBillService.getPowerPurchaseStatus(
            getPowerPurchaseStatusDto,
            user
        );
    }
}
