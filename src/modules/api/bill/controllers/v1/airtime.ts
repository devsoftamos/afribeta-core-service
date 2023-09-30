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
import { PaymentReferenceDto } from "../../dtos";
import { PurchaseAirtimeDto } from "../../dtos/airtime";
import { InitializeBillPaymentGuard } from "../../guard";
import { AirtimeBillService } from "../../services/airtime";

@UseGuards(AuthGuard)
@Controller({
    path: "bill/airtime",
})
export class AirtimeBillController {
    constructor(private readonly airtimeBillService: AirtimeBillService) {}

    @HttpCode(HttpStatus.OK)
    @Post("initialize-airtime-purchase")
    @UseGuards(InitializeBillPaymentGuard)
    async initializeDataPurchase(
        @Body(ValidationPipe)
        purchaseAirtimeDto: PurchaseAirtimeDto,
        @User() user: UserModel
    ) {
        return await this.airtimeBillService.initializeAirtimePurchase(
            purchaseAirtimeDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("wallet-payment")
    async walletPayment(
        @Body(ValidationPipe)
        walletAirtimePaymentDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.airtimeBillService.walletPayment(
            walletAirtimePaymentDto,
            user
        );
    }

    @Get("verify/:reference")
    async getAirtimePurchaseStatus(
        @Param(ValidationPipe)
        getAirtimePurchaseStatusDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.airtimeBillService.verifyAirtimePurchase(
            getAirtimePurchaseStatusDto,
            user
        );
    }

    @Get("network")
    async getAirtimeNetworks() {
        return await this.airtimeBillService.getAirtimeNetworks();
    }
}
