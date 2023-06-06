import { RequestWithUser } from "@/modules/api/auth";
import { AuthGuard } from "@/modules/api/auth/guard";
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
import { User as UserEntity } from "@prisma/client";
import { User } from "../../decorator";
import {
    UpdateProfilePasswordDto,
    UpsertTransactionPinDto,
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
    @Patch("profile/save-transaction-pin")
    async upsertTransactionPin(
        @Body(ValidationPipe) upsertTransactionPinDto: UpsertTransactionPinDto,
        @User() user: UserEntity
    ) {
        return await this.userService.upsertTransactionPin(
            upsertTransactionPinDto,
            user
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("profile/verify-transaction-pin")
    async verifyTransactionPin(
        @Body(ValidationPipe) verifyTransactionPinDto: VerifyTransactionPinDto,
        @User() user: UserEntity
    ) {
        return await this.userService.verifyTransactionPin(
            verifyTransactionPinDto,
            user
        );
    }
}
