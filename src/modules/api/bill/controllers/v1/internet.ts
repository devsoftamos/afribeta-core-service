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
import {
    GetInternetBundleDto,
    GetSmileDeviceInfoDto,
    PurchaseInternetDto,
} from "../../dtos/internet";
import { InternetBillService } from "../../services/internet";

@UseGuards(AuthGuard)
@Controller({
    path: "bill/internet",
})
export class InternetBillController {
    constructor(private readonly internetBillService: InternetBillService) {}

    @Get()
    async getInternetBundles(
        @Query(ValidationPipe) getInternetBundleDto: GetInternetBundleDto
    ) {
        return await this.internetBillService.getInternetBundles(
            getInternetBundleDto
        );
    }

    @Get("network")
    async getDataNetworks() {
        return await this.internetBillService.getInternetNetworks();
    }

    @HttpCode(HttpStatus.OK)
    @Post("initialize-internet-purchase")
    async initializeDataPurchase(
        @Body(ValidationPipe)
        purchaseInternetDto: PurchaseInternetDto,
        @User() user: UserModel
    ) {
        return await this.internetBillService.initializeInternetPurchase(
            purchaseInternetDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("wallet-payment")
    async walletPayment(
        @Body(ValidationPipe)
        walletInternetPaymentDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.internetBillService.walletPayment(
            walletInternetPaymentDto,
            user
        );
    }

    @Get("status/:reference")
    async getDataPurchaseStatus(
        @Param(ValidationPipe)
        getInternetPurchaseStatusDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.internetBillService.getInternetPurchaseStatus(
            getInternetPurchaseStatusDto,
            user
        );
    }

    @Get("verify-smile")
    async getSmileDeviceInfo(
        @Query(ValidationPipe) getSmileDeviceInfoDto: GetSmileDeviceInfoDto
    ) {
        return await this.internetBillService.getSmileDeviceInfo(
            getSmileDeviceInfoDto
        );
    }
}
