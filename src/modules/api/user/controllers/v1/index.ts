import { RequestWithUser } from "@/modules/api/auth";
import { AuthGuard } from "@/modules/api/auth/guard";
import { Controller, Get, Req, UseGuards } from "@nestjs/common";
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
}
