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
    GetSmartCardInfoDto,
    GetTVBouquetDto,
    PurchaseTVDto,
} from "../../dtos/cabletv";
import { InitializeBillPaymentGuard } from "../../guard";
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

    @Get("smartcard")
    async getSmartCardInfo(
        @Query(ValidationPipe) getSmartCardInfoDto: GetSmartCardInfoDto
    ) {
        return await this.cableTVBillService.getSmartCardInfo(
            getSmartCardInfoDto
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("initialize-cabletv-purchase")
    @UseGuards(InitializeBillPaymentGuard)
    async initializeCableTVPurchase(
        @Body(ValidationPipe)
        purchaseCableTVDto: PurchaseTVDto,
        @User() user: UserModel
    ) {
        return await this.cableTVBillService.initializeCableTVPurchase(
            purchaseCableTVDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("wallet-payment")
    async walletPayment(
        @Body(ValidationPipe)
        walletCableTVPaymentDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.cableTVBillService.walletPayment(
            walletCableTVPaymentDto,
            user
        );
    }

    @Get("verify/:reference")
    async getDataPurchaseStatus(
        @Param(ValidationPipe)
        getCableTVPurchaseStatusDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.cableTVBillService.verifyCableTVPurchase(
            getCableTVPurchaseStatusDto,
            user
        );
    }
}
