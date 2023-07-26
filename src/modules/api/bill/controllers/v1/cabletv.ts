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
import { GetTVBouquetDto } from "../../dtos/cabletv";
import { PurchaseDataDto } from "../../dtos/data";
import { CableTVBillService } from "../../services/cabletv";

@UseGuards(AuthGuard)
@Controller({
    path: "bill/cabletv",
})
export class CableTVBillController {
    constructor(private readonly cableTVBillService: CableTVBillService) {}

    @Get("network")
    async getTVNetworks() {
        return await this.cableTVBillService.getTVNetworks();
    }

    @Get()
    async getTVBouquets(
        @Query(ValidationPipe) getTVBouquetDto: GetTVBouquetDto
    ) {
        return await this.cableTVBillService.getTVBouquets(getTVBouquetDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post("initialize-data-purchase")
    async initializeDataPurchase(
        @Body(ValidationPipe)
        purchaseDataDto: PurchaseDataDto,
        @User() user: UserModel
    ) {
        return await this.cableTVBillService.initializeDataPurchase(
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
        return await this.cableTVBillService.walletPayment(
            walletDataPaymentDto,
            user
        );
    }

    @Get("status/:reference")
    async getDataPurchaseStatus(
        @Param(ValidationPipe)
        getDataPurchaseStatusDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.cableTVBillService.getDataPurchaseStatus(
            getDataPurchaseStatusDto,
            user
        );
    }
}
