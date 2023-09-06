import { RequestWithUser } from "@/modules/api/auth";
import { AuthGuard } from "@/modules/api/auth/guard";
import { CreateAgentAbility, ViewAgentAbility } from "@/modules/core/ability";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserModel } from "@prisma/client";
import { User } from "../../decorators";
import {
    CreateAgentDto,
    CreateKycDto,
    CreateTransactionPinDto,
    ListMerchantAgentsDto,
    UpdateProfileDto,
    UpdateProfilePasswordDto,
    UpdateTransactionPinDto,
    VerifyTransactionPinDto,
} from "../../dtos";
import { UserService } from "../../services";

@UseGuards(AuthGuard)
@Controller({
    path: "user",
})
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get("profile")
    async getProfile(@Req() req: RequestWithUser) {
        return await this.userService.getProfile(req.user.identifier);
    }

    @Patch("profile/update-password")
    async updateProfilePassword(
        @Body(ValidationPipe)
        updateProfilePasswordDto: UpdateProfilePasswordDto,
        @Req() req: RequestWithUser
    ) {
        return await this.userService.updateProfilePassword(
            updateProfilePasswordDto,
            req.user
        );
    }
    @Patch("profile/transaction-pin")
    async upsertTransactionPin(
        @Body(ValidationPipe) updateTransactionPinDto: UpdateTransactionPinDto,
        @User() user: UserModel
    ) {
        return await this.userService.updateTransactionPin(
            updateTransactionPinDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("profile/verify-transaction-pin")
    async verifyTransactionPin(
        @Body(ValidationPipe) verifyTransactionPinDto: VerifyTransactionPinDto,
        @User() user: UserModel
    ) {
        return await this.userService.verifyTransactionPin(
            verifyTransactionPinDto,
            user
        );
    }

    @Post("profile/transaction-pin")
    async createTransactionPin(
        @Body(ValidationPipe) createTransactionPinDto: CreateTransactionPinDto,
        @User() user: UserModel
    ) {
        return await this.userService.createTransactionPin(
            createTransactionPinDto,
            user
        );
    }

    @Patch("profile")
    async updateProfile(
        @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
        @User() user: UserModel
    ) {
        return await this.userService.updateProfile(updateProfileDto, user);
    }

    @Post("agent")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new CreateAgentAbility())
    async createAgent(
        @Body(ValidationPipe) createAgentDto: CreateAgentDto,
        @User() user: UserModel
    ) {
        return await this.userService.createAgent(createAgentDto, user);
    }

    @Get("agent")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new ViewAgentAbility())
    async getMerchantAgents(
        @Query(ValidationPipe) listMerchantAgentsDto: ListMerchantAgentsDto,
        @User() user: UserModel
    ) {
        return await this.userService.getMerchantAgents(
            listMerchantAgentsDto,
            user
        );
    }

    @Get("commission")
    async getUserBillCommissions(@User() user: UserModel) {
        return await this.userService.getServiceCommissions(user);
    }

    @Post("kyc")
    async createKyc(
        @Body(ValidationPipe) kycDto: CreateKycDto,
        @User() user: UserModel
    ) {
        return await this.userService.createKyc(kycDto, user);
    }
}
