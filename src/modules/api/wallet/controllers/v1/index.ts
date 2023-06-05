import { RequestWithUser } from "@/modules/api/auth";
import { AuthGuard } from "@/modules/api/auth/guard";
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { InitiateWalletCreationDto } from "../../dto";
import { WalletService } from "../../services";

@UseGuards(AuthGuard)
@Controller({
    path: "wallets",
})
export class WalletController {
    constructor(private readonly walletService: WalletService) {}

    @HttpCode(HttpStatus.OK)
    @Post("customers")
    async initiateWalletCreation(
        @Body(ValidationPipe)
        initiateWalletCreationDto: InitiateWalletCreationDto,
        @Req() req: RequestWithUser
    ) {
        return await this.walletService.initiateCustomerWalletCreation(
            initiateWalletCreationDto,
            req.user
        );
    }
}
