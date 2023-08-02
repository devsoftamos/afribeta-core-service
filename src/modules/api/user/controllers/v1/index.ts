import { RequestWithUser } from "@/modules/api/auth";
import { AuthGuard } from "@/modules/api/auth/guard";
import { CreateAgentAbility } from "@/modules/core/ability";
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
    Req,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserModel } from "@prisma/client";
import { User } from "../../decorators";
import {
    CreateAgentDto,
    CreateTransactionPinDto,
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
        @Body(ValidationPipe) CreateAgentDto: CreateAgentDto,
        @User() user: UserModel
    ) {
        return await this.userService.createAgent(CreateAgentDto, user);
    }
}
