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
import { GetDataBundleDto, PurchaseDataDto } from "../../dtos/data";
import { DataBillService } from "../../services/data";

@UseGuards(AuthGuard)
@Controller({
    path: "bill/data",
})
export class DataController {
    constructor(private readonly dataBillService: DataBillService) {}

    @Get()
    async getDataBundles(
        @Query(ValidationPipe) getDataBundleDto: GetDataBundleDto
    ) {
        return await this.dataBillService.getDataBundles(getDataBundleDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post("initialize-data-purchase")
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

    @Get("status/:reference")
    async getPowerPurchaseStatus(
        @Param(ValidationPipe)
        getDataPurchaseStatusDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.dataBillService.getDataPurchaseStatus(
            getDataPurchaseStatusDto,
            user
        );
    }
}
