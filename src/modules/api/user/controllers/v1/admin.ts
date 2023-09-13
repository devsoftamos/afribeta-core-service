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
    UseGuards,
} from "@nestjs/common";
import {
    FetchMerchantAgentsDto,
    ListMerchantAgentsDto,
    MerchantDetailsDto,
} from "../../dtos";
import { User as UserModel } from "@prisma/client";
import { UserService } from "../../services";
import { AuthGuard } from "@/modules/api/auth/guard";
import { User } from "../../decorators";

@Controller({
    path: "admin/user",
})
export class AdminUserController {
    constructor(private readonly usersService: UserService) {}

    @Get("merchants")
    @UseGuards(AuthGuard)
    async fetchMerchants(
        @Query(ValidationPipe) fetchMerchantsDto: FetchMerchantAgentsDto,
        @User() user: UserModel
    ) {
        return await this.usersService.fetchMerchants(fetchMerchantsDto, user);
    }

    @Get("customers")
    @UseGuards(AuthGuard)
    async fetchCustomers(
        @Query(ValidationPipe) fetchCustomersDto: ListMerchantAgentsDto,
        @User() user: UserModel
    ) {
        return await this.usersService.fetchCustomers(fetchCustomersDto, user);
    }

    @Get("merchant/details")
    async getMerchantDetails(
        @Query(ValidationPipe)
        merchantDetails: MerchantDetailsDto
    ) {
        return await this.usersService.merchantDetails(merchantDetails);
    }

    @Get("merchant/view-agents")
    @UseGuards(AuthGuard)
    async fetchMerchantAgents(
        @Query(ValidationPipe) fetchMerchantsAgentDto: ListMerchantAgentsDto,
        @User() user: UserModel
    ) {
        return await this.usersService.getMerchantAgents(
            fetchMerchantsAgentDto,
            user
        );
    }
}
