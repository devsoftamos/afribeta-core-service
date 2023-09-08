import { RequestWithUser } from "@/modules/api/auth";
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
import { AdminUserService } from "../../services/admin";
import { FetchMerchantAgentsDto, ListMerchantAgentsDto } from "../../dtos";
import { User as UserModel } from "@prisma/client";
import { User } from "../../decorators";


@Controller({
    path: "admin/user",
})

export class AdminUserController {
    constructor(private readonly adminService: AdminUserService) { }

    @Get("merchants")
    async fetchMerchants(
        @Query(ValidationPipe) listMerchantAgentsDto: FetchMerchantAgentsDto,
        @User() user: UserModel
    ) {
        return this.adminService.fetchAMerchant(
            listMerchantAgentsDto,
            user
        )
    }
}