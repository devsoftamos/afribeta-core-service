import { Controller, Get, UseGuards } from "@nestjs/common";
import { CommissionService } from "../../services";
import { User } from "@/modules/api/user";
import { User as UserModel } from "@prisma/client";
import { AuthGuard } from "@/modules/api/auth/guard";

@UseGuards(AuthGuard)
@Controller({
    path: "commission",
})
export class CommissionController {
    constructor(private readonly commissionService: CommissionService) {}

    @Get()
    async getUserBillCommissions(@User() user: UserModel) {
        return await this.commissionService.getServiceCommissions(user);
    }
}
