import { RequestWithUser } from "@/modules/api/auth";
import { AuthGuard } from "@/modules/api/auth/guard";
import { CreateAgentAbility, ViewAgentAbility } from "@/modules/core/ability";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { AdminService } from "../../services/admin.service";
import { ListMerchantAgentsDto } from "../../dtos";
import { User as UserModel } from "@prisma/client";
import { User } from "../../decorators";

@UseGuards(AuthGuard)
@Controller({
    path: "admin",
})

export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('merchants')
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new ViewAgentAbility())
    async fetchMerchants(
        @Query(ValidationPipe) listMerchantAgentsDto: ListMerchantAgentsDto,
        @User() user: UserModel
    ){
        return this.adminService.fetchAMerchant(
            listMerchantAgentsDto,
            user
        )
    }
}