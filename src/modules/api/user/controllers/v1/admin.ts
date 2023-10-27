import { User } from "../../decorators";
import {
    Controller,
    Param,
    Get,
    Query,
    ParseIntPipe,
    ValidationPipe,
    UseGuards,
    Body,
    Post,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import {
    AuthorizeAgentToMerchantUpgradeAgentDto,
    FetchAllMerchantsDto,
    FetchMerchantAgentsDto,
    ListMerchantAgentsDto,
} from "../../dtos";
import { User as UserModel } from "@prisma/client";
import { UserService } from "../../services";
import { AuthGuard } from "@/modules/api/auth/guard";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import {
    AuthorizeAgentUpgradeAbility,
    ReadUserAbility,
} from "@/modules/core/ability";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/user",
})
export class AdminUserController {
    constructor(private readonly usersService: UserService) {}

    @Get("merchant")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new ReadUserAbility())
    async fetchMerchants(
        @Query(ValidationPipe) fetchMerchantsDto: FetchMerchantAgentsDto
    ) {
        return await this.usersService.fetchMerchants(fetchMerchantsDto);
    }

    @Get("customer")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new ReadUserAbility())
    async fetchCustomers(
        @Query(ValidationPipe) fetchCustomersDto: ListMerchantAgentsDto
    ) {
        return await this.usersService.fetchCustomers(fetchCustomersDto);
    }

    @Get("merchant/:id")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new ReadUserAbility())
    async getMerchantDetails(@Param("id", ParseIntPipe) id: number) {
        return await this.usersService.merchantDetails(id);
    }

    @Get("merchant/:id/agent")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new ReadUserAbility())
    async fetchMerchantAgents(
        @Query(ValidationPipe) fetchMerchantsAgentDto: ListMerchantAgentsDto,
        @User() user: UserModel,
        @Param("id", ParseIntPipe) id: number
    ) {
        return await this.usersService.getMerchantAgents(
            fetchMerchantsAgentDto,
            user,
            id
        );
    }

    @HttpCode(HttpStatus.OK)
    @Post("agent/:id/upgrade")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new AuthorizeAgentUpgradeAbility())
    async authorizeAgentUpgrade(
        @Param("id", ParseIntPipe) id: number,
        @Body(ValidationPipe)
        authorizeAgentToMerchantUpgradeAgentDto: AuthorizeAgentToMerchantUpgradeAgentDto
    ) {
        return await this.usersService.authorizeAgentToMerchantUpgradeRequest(
            id,
            authorizeAgentToMerchantUpgradeAgentDto
        );
    }

    @Get("overview/merchants")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new ReadUserAbility())
    async fetchAllMerchants(
        @Query(ValidationPipe) fetchAllMerchantsDto: FetchAllMerchantsDto
    ) {
        return await this.usersService.getAllMerchants(fetchAllMerchantsDto);
    }
}
