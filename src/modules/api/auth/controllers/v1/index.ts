import { ApiResponse } from "@/utils/api-response-util";
import { Body, Controller, Post, Req, ValidationPipe } from "@nestjs/common";
import { Request } from "express";
import { SendVerificationCodeDto, SignInDto, SignUpDto } from "../../dtos";
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

    @Post("login")
    async signIn(
        @Body(ValidationPipe) signInDto: SignInDto
    ): Promise<ApiResponse> {
        return await this.authService.signIn(signInDto);
    }

    @Post("verify-email")
    async sendAccountVerificationEmail(
        @Body(ValidationPipe) sendVerificationCodeDto: SendVerificationCodeDto
    ) {
        return await this.authService.sendAccountVerificationEmail(
            sendVerificationCodeDto
        );
    }
}
