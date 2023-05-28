import { ApiResponse } from "@/utils/api-response-util";
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    ValidationPipe,
} from "@nestjs/common";
import { Request } from "express";
import {
    PasswordResetRequestDto,
    SendVerificationCodeDto,
    SignInDto,
    SignUpDto,
} from "../../dtos";
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
        @Body(ValidationPipe) signInDto: SignInDto
    ): Promise<ApiResponse> {
        return await this.authService.signIn(signInDto);
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
}
