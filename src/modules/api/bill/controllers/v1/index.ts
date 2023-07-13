import { AuthGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserModel } from "@prisma/client";
import {
    PurchasePowerDto,
    PurchasePowerViaExternalPaymentProcessorDto,
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
        purchasePowerDto: PurchasePowerViaExternalPaymentProcessorDto,
        @User() user: UserModel
    ) {
        return await this.powerBillService.initializePowerPurchase(
            purchasePowerDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("power/wallet-purchase")
    async purchasePowerViaWallet(
        @Body(ValidationPipe)
        purchasePowerDto: PurchasePowerDto,
        @User() user: UserModel
    ) {
        return await this.powerBillService.purchasePowerWithWallet(
            purchasePowerDto,
            user
        );
    }
}
