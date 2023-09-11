import { RequestWithUser } from "@/modules/api/auth";
import { CreateAgentAbility, ViewAgentAbility } from "@/modules/core/ability";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    Query,
    ValidationPipe,
    Req,
} from "@nestjs/common";
import { FetchMerchantAgentsDto} from "../../dtos";
import { User as UserModel } from "@prisma/client";
import { User } from "../../decorators";
import { UserService } from "../../services";


@Controller({
    path: "admin/user",
})

export class AdminUserController {
    constructor(private readonly usersService: UserService) { }

    @Get("merchants")
    async fetchMerchants(
        @Query(ValidationPipe) fetchMerchantsDto: FetchMerchantAgentsDto
    ) {
        return this.usersService.fetchMerchants(
            fetchMerchantsDto
        )
    }
}