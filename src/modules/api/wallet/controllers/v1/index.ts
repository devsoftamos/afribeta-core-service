import { AuthGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserEntity } from "@prisma/client";
import {
    InitializeWalletFundingDto,
    InitializeWithdrawalDto,
    InitiateWalletCreationDto,
} from "../../dto";
import { WalletService } from "../../services";

@UseGuards(AuthGuard)
@Controller({
    path: "wallet",
})
export class WalletController {
    constructor(private readonly walletService: WalletService) {}

    @HttpCode(HttpStatus.OK)
    @Post("initialize-creation")
    async initiateWalletCreation(
        @Body(ValidationPipe)
        initiateWalletCreationDto: InitiateWalletCreationDto,
        @User() user: UserEntity
    ) {
        return await this.walletService.initiateCustomerWalletCreation(
            initiateWalletCreationDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("initialize-funding")
    async initializeWalletFunding(
        @Body(ValidationPipe)
        initializeWalletFundingDto: InitializeWalletFundingDto,
        @User() user: UserEntity
    ) {
        return await this.walletService.initializeWalletFunding(
            initializeWalletFundingDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("initialize-withdrawal")
    async withdrawFund(
        @Body(ValidationPipe) withdrawFundDto: InitializeWithdrawalDto,
        @User() user: UserEntity
    ) {
        return await this.walletService.initializeWalletWithdrawal(
            withdrawFundDto,
            user
        );
    }
}
