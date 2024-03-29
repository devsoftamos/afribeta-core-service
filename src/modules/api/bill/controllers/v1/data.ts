import { AuthGuard, EnabledAccountGuard } from "@/modules/api/auth/guard";
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
import { GetDataBundleDto, PurchaseDataDto } from "../../dtos/data";
import { InitializeBillPaymentGuard } from "../../guard";
import { DataBillService } from "../../services/data";

@UseGuards(AuthGuard, EnabledAccountGuard)
@Controller({
    path: "bill/data",
})
export class DataBillController {
    constructor(private readonly dataBillService: DataBillService) {}

    @Get()
    async getDataBundles(
        @Query(ValidationPipe) getDataBundleDto: GetDataBundleDto
    ) {
        return await this.dataBillService.getDataBundles(getDataBundleDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post("initialize-data-purchase")
    @UseGuards(InitializeBillPaymentGuard)
    async initializeDataPurchase(
        @Body(ValidationPipe)
        purchaseDataDto: PurchaseDataDto,
        @User() user: UserModel
    ) {
        return await this.dataBillService.initializeDataPurchase(
            purchaseDataDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("wallet-payment")
    async walletPayment(
        @Body(ValidationPipe)
        walletDataPaymentDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.dataBillService.walletPayment(
            walletDataPaymentDto,
            user
        );
    }

    @Get("verify/:reference")
    async getDataPurchaseStatus(
        @Param(ValidationPipe)
        getDataPurchaseStatusDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.dataBillService.verifyDataPurchase(
            getDataPurchaseStatusDto,
            user
        );
    }

    @Get("network")
    async getDataNetworks() {
        return await this.dataBillService.getDataNetworks();
    }
}
