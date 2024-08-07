import { AuthGuard, EnabledAccountGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import {
    FundSubAgentAbility,
    FundRequestAbility,
    FundWalletFromCommissionAbility,
    PayoutRequestAbility,
} from "@/modules/core/ability";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
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
import {
    AuthorizeFundRequestDto,
    CreateVendorWalletDto,
    FundSubAgentDto,
    FundWalletFromCommissionBalanceDto,
    InitializeWalletFundingDto,
    InitializeWithdrawalDto,
    InitiateWalletCreationDto,
    ListWalletTransactionDto,
    PaymentReferenceDto,
    PayoutRequestDto,
    RequestWalletFundingDto,
    TransferToOtherWalletDto,
    VerifyIdentityDto,
    VerifyWalletDto,
} from "../../dto";
import { WalletService } from "../../services";

@UseGuards(AuthGuard, EnabledAccountGuard)
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

    @HttpCode(HttpStatus.OK)
    @Post("assign-vendor-wallet")
    async createVendorWallet(
        @Body(ValidationPipe) createVendorWalletDto: CreateVendorWalletDto,
        @User() user: UserModel
    ) {
        return await this.walletService.createAgencyWallet({
            bvn: createVendorWalletDto.bvn,
            user: user,
        });
    }

    @Get("fund/verify/:reference")
    async verifySelfWalletFunding(
        @Param(ValidationPipe)
        paymentReferenceDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.walletService.verifySelfWalletFunding(
            paymentReferenceDto,
            user
        );
    }

    @Get("transfer/bank/verify/:reference")
    async verifyWalletToBankTransfer(
        @Param(ValidationPipe)
        paymentReferenceDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.walletService.verifyWalletToBankTransfer(
            paymentReferenceDto,
            user
        );
    }

    @Get("transfer/verify/:reference")
    async verifyWalletToWalletTransfer(
        @Param(ValidationPipe)
        paymentReferenceDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.walletService.verifyWalletToWalletTransfer(
            paymentReferenceDto,
            user
        );
    }

    @Get("transaction")
    async listWalletTransactions(
        @Query(ValidationPipe)
        listWalletTransactionDto: ListWalletTransactionDto,
        @User() user: UserModel
    ) {
        return await this.walletService.listWalletTransactions(
            listWalletTransactionDto,
            user
        );
    }

    //Fund sub agent
    @HttpCode(HttpStatus.OK)
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new FundSubAgentAbility())
    @Post("merchant/fund-agent")
    async transferToOSubAgentWallet(
        @Body(ValidationPipe)
        fundSubAgentDto: FundSubAgentDto,
        @User() user: UserModel
    ) {
        return await this.walletService.fundSubAgent(fundSubAgentDto, user);
    }

    @Get("merchant/agent/fund/verify/:reference")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new FundSubAgentAbility())
    async verifySubAgentFunding(
        @Param(ValidationPipe)
        paymentReferenceDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.walletService.verifySubAgentFunding(
            paymentReferenceDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("agent/fund-request")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new FundRequestAbility())
    async requestWalletFunding(
        @Body(ValidationPipe) requestWalletFundingDto: RequestWalletFundingDto,
        @User() user: UserModel
    ) {
        return await this.walletService.requestWalletFunding(
            requestWalletFundingDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("merchant/agent/authorize-fund-request")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new FundSubAgentAbility())
    async authorizeFundRequest(
        @Body(ValidationPipe) authorizeFundRequestDto: AuthorizeFundRequestDto,
        @User() user: UserModel
    ) {
        return await this.walletService.authorizeFundRequest(
            authorizeFundRequestDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("commission/fund-main-wallet")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new FundWalletFromCommissionAbility())
    async fundWalletFromCommissionBalance(
        @Body(ValidationPipe)
        fundWalletFromCommissionBalanceDto: FundWalletFromCommissionBalanceDto,
        @User() user: UserModel
    ) {
        return await this.walletService.fundWalletFromCommissionBalance(
            fundWalletFromCommissionBalanceDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("payout-request")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new PayoutRequestAbility())
    async payoutRequest(
        @Body(ValidationPipe) payoutRequestDto: PayoutRequestDto,
        @User() user: UserModel
    ) {
        return await this.walletService.payoutRequest(payoutRequestDto, user);
    }

    @Get("payout/verify/:reference")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new PayoutRequestAbility())
    async verifyPayoutRequest(
        @Param(ValidationPipe)
        paymentReferenceDto: PaymentReferenceDto,
        @User() user: UserModel
    ) {
        return await this.walletService.verifyPayoutRequest(
            paymentReferenceDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("verify-identity")
    async verifyIdentity(
        @Body() bodyDto: VerifyIdentityDto,
        @User() user: UserModel
    ) {
        return await this.walletService.verifyIdentity(bodyDto, user);
    }
}
