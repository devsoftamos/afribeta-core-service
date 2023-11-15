import { RequestWithUser } from "@/modules/api/auth";
import { AuthGuard, EnabledAccountGuard } from "@/modules/api/auth/guard";
import {
    CreateKYCAbility,
    CreateSubAgentAbility,
    ViewSubAgentAbility,
} from "@/modules/core/ability";
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
    CreateSubAgentDto,
    CreateKycDto,
    CreateTransactionPinDto,
    ListMerchantAgentsDto,
    UpdateProfileDto,
    UpdateProfilePasswordDto,
    UpdateTransactionPinDto,
    VerifyTransactionPinDto,
    CountAgentsCreatedDto,
} from "../../dtos";
import { UserService } from "../../services";

@UseGuards(AuthGuard, EnabledAccountGuard)
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
    @CheckAbilities(new CreateSubAgentAbility())
    async createAgent(
        @Body(ValidationPipe) createAgentDto: CreateSubAgentDto,
        @User() user: UserModel
    ) {
        return await this.userService.createAgent(createAgentDto, user);
    }

    @Get("agent")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new ViewSubAgentAbility())
    async getMerchantAgents(
        @Query(ValidationPipe) listMerchantAgentsDto: ListMerchantAgentsDto,
        @User() user: UserModel
    ) {
        return await this.userService.getMerchantAgents(
            listMerchantAgentsDto,
            user
        );
    }

    @Post("kyc")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new CreateKYCAbility())
    async createKyc(
        @Body(ValidationPipe) kycDto: CreateKycDto,
        @User() user: UserModel
    ) {
        return await this.userService.createKyc(kycDto, user);
    }

    @Get("agent/count")
    async countAgentsCreated(
        @Query(ValidationPipe) countAgentsCreatedDto: CountAgentsCreatedDto,
        @User() user: UserModel
    ) {
        return await this.userService.countAgentsCreated(
            countAgentsCreatedDto,
            user
        );
    }
}
