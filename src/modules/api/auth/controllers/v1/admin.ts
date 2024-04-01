import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    ValidationPipe,
} from "@nestjs/common";
import { ApiResponse } from "@/utils/api-response-util";
import { SignInDto } from "../../dtos";
import { AuthService } from "../../services";
import { ClientData } from "../../decorators";

@Controller({
    path: "admin/auth",
})
export class AdminAuthController {
    constructor(private authService: AuthService) {}

    @HttpCode(HttpStatus.OK)
    @Post("login")
    async signIn(
        @Body(ValidationPipe) signInDto: SignInDto,
        @ClientData() ipAddress: string
    ): Promise<ApiResponse> {
        return await this.authService.adminSignIn(signInDto, ipAddress);
    }
}
