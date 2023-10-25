import { User } from "@/modules/api/user";
import { CreateSubAgentAbility } from "@/modules/core/ability";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import { ApiResponse } from "@/utils/api-response-util";
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    Req,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserModel } from "@prisma/client";
import { Request } from "express";
import {
    PasswordResetRequestDto,
    SendVerificationCodeDto,
    SignUpDto,
    UpdatePasswordDto,
    UserSigInDto,
} from "../../dtos";
import { AuthGuard } from "../../guard";
import { AuthService } from "../../services";

@Controller({
    path: "auth",
})
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post("signup")
    async signUp(
        @Body(ValidationPipe) signUpDto: SignUpDto,
        @Req() req: Request
    ): Promise<ApiResponse> {
        return await this.authService.signUp(signUpDto, req.ip);
    }

    @HttpCode(HttpStatus.OK)
    @Post("login")
    async signIn(
        @Body(ValidationPipe) signInDto: UserSigInDto
    ): Promise<ApiResponse> {
        return await this.authService.userSignIn(signInDto);
    }

    @HttpCode(HttpStatus.OK)
    @Post("verify-email")
    async sendAccountVerificationEmail(
        @Body(ValidationPipe) sendVerificationCodeDto: SendVerificationCodeDto
    ) {
        return await this.authService.sendAccountVerificationEmail(
            sendVerificationCodeDto
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("password-reset-request")
    async passwordResetRequest(
        @Body(ValidationPipe) passwordResetRequestDto: PasswordResetRequestDto
    ) {
        return await this.authService.passwordResetRequest(
            passwordResetRequestDto
        );
    }

    @Patch("update-password")
    async updatePassword(
        @Body(ValidationPipe) updatePasswordDto: UpdatePasswordDto
    ) {
        return await this.authService.updatePassword(updatePasswordDto);
    }

    @UseGuards(AuthGuard, AbilitiesGuard)
    @CheckAbilities(new CreateSubAgentAbility())
    @HttpCode(HttpStatus.OK)
    @Post("verify-agent-email")
    async sendAgentAccountVerificationEmail(
        @Body(ValidationPipe) sendVerificationCodeDto: SendVerificationCodeDto,
        @User() user: UserModel
    ) {
        return await this.authService.sendAgentAccountVerificationEmail(
            sendVerificationCodeDto,
            user
        );
    }
}
