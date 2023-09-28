import { User } from "@/modules/api/user";
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
import { Request } from "express";
import { ApiResponse } from "@/utils/api-response-util";
import { SignInDto } from "../../dtos";
import { AuthGuard } from "../../guard";
import { AuthService } from "../../services";

@Controller({
    path: "admin/auth",
})
export class AdminAuthController {
    constructor(private authService: AuthService) {}

    @HttpCode(HttpStatus.OK)
    @Post("login")
    async signIn(
        @Body(ValidationPipe) signInDto: SignInDto
    ): Promise<ApiResponse> {
        return await this.authService.adminSignIn(signInDto);
    }
}
