import { RequestWithUser } from "@/modules/api/auth";
import { AuthGuard } from "@/modules/api/auth/guard";
import {
    Body,
    Controller,
    Get,
    Patch,
    Req,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { UpdateProfilePasswordDto } from "../../dtos";
import { UserService } from "../../services";

@UseGuards(AuthGuard)
@Controller({
    path: "users",
})
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get("profiles")
    async getProfile(@Req() req: RequestWithUser) {
        return await this.userService.getProfile(req.user.identifier);
    }

    @Patch("profiles/update-password")
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
}
