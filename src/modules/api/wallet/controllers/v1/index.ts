import { AuthGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserModel } from "@prisma/client";
import {
    InitializeWalletFundingDto,
    InitializeWithdrawalDto,
    InitiateWalletCreationDto,
    TransferToOtherWalletDto,
    VerifyWalletDto,
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
        @User() user: UserModel
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
        @User() user: UserModel
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
        @User() user: UserModel
    ) {
        return await this.walletService.initializeWalletWithdrawal(
            withdrawFundDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("transfer")
    async transferToOtherWallet(
        @Body(ValidationPipe)
        transferToOtherWalletDto: TransferToOtherWalletDto,
        @User() user: UserModel
    ) {
        return await this.walletService.transferToOtherWallet(
            transferToOtherWalletDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Get("verify-number")
    async verifyWallet(
        @Query(ValidationPipe)
        verifyWalletDto: VerifyWalletDto
    ) {
        return await this.walletService.verifyWallet(verifyWalletDto);
    }

    @Get()
    async getUserWallet(@User() user: UserModel) {
        return await this.walletService.getWallet(user.id);
    }
}
