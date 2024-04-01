import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    ValidationPipe,
} from "@nestjs/common";
import { ApiResponse } from "@/utils/api-response-util";
import { SignInDto } from "../../dtos";
import { AuthService } from "../../services";
import { Request } from "express";

@Controller({
    path: "admin/auth",
})
export class AdminAuthController {
    constructor(private authService: AuthService) {}

    @HttpCode(HttpStatus.OK)
    @Post("login")
    async signIn(
        @Body(ValidationPipe) signInDto: SignInDto,
        @Req() req: Request
    ): Promise<ApiResponse> {
        const ipAddress = req.socket.remoteAddress;
        return await this.authService.adminSignIn(signInDto, ipAddress);
    }
}
