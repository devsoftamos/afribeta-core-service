import { User } from "../../decorators";
import {
    Controller,
    Param,
    Get,
    Query,
    ParseIntPipe,
    ValidationPipe,
    UseGuards,
    Post,
    Body,
    HttpStatus,
    HttpCode,
    Patch,
} from "@nestjs/common";
import {
    AuthorizeAgentToMerchantUpgradeAgentDto,
    CountAgentsCreatedDto,
    CreateUserDto,
    EnableOrDisableUserDto,
    FetchAllMerchantsDto,
    FetchMerchantAgentsDto,
    ListAdminUsers,
    ListMerchantAgentsDto,
} from "../../dtos";
import { User as UserModel } from "@prisma/client";
import { UserService } from "../../services";
import { AuthGuard } from "@/modules/api/auth/guard";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import * as Ability from "@/modules/core/ability";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/user",
})
export class AdminUserController {
    constructor(private readonly usersService: UserService) {}

    @Get("merchant")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadUserAbility())
    async fetchMerchants(
        @Query(ValidationPipe) fetchMerchantsDto: FetchMerchantAgentsDto
    ) {
        return await this.usersService.fetchMerchants(fetchMerchantsDto);
    }

    @Get("customer")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadUserAbility())
    async fetchCustomers(
        @Query(ValidationPipe) fetchCustomersDto: ListMerchantAgentsDto
    ) {
        return await this.usersService.fetchCustomers(fetchCustomersDto);
    }

    @Get("merchant/:id")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadUserAbility())
    async getMerchantDetails(@Param("id", ParseIntPipe) id: number) {
        return await this.usersService.merchantDetails(id);
    }

    @Get("merchant/:id/agent")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadUserAbility())
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
    @CheckAbilities(new Ability.AuthorizeAgentUpgradeAbility())
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

    @Get("overview/merchant")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadUserAbility())
    async fetchAllMerchants(
        @Query(ValidationPipe) fetchAllMerchantsDto: FetchAllMerchantsDto
    ) {
        return await this.usersService.getAllMerchants(fetchAllMerchantsDto);
    }

    @Get()
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadUserAbility())
    async fetchAdmins(@Query(ValidationPipe) fetchAdminsDto: ListAdminUsers) {
        return await this.usersService.fetchAdmins(fetchAdminsDto);
    }

    @Post()
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.CreateAdminAbility())
    async createUser(@Body(ValidationPipe) createUserDto: CreateUserDto) {
        return await this.usersService.createNewUser(createUserDto);
    }

    @Get("count/merchant")
    async countMerchants(
        @Query(ValidationPipe) countAgentsCreatedDto: CountAgentsCreatedDto
    ) {
        return await this.usersService.countMerchants(countAgentsCreatedDto);
    }

    @Get("customer/:id")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadUserAbility())
    async getCustomerDetails(@Param("id", ParseIntPipe) id: number) {
        return await this.usersService.customerDetails(id);
    }

    @Get("agent/:id/kyc")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadUserAbility())
    async getAgentDetails(@Param("id", ParseIntPipe) id: number) {
        return await this.usersService.getAgentDetails(id);
    }

    @Patch("enable-disable-account/:id")
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.AccountActivationAndDeactivationAbility())
    async enableOrDisableUserAccount(
        @Param("id", ParseIntPipe) id: number,
        @Body(ValidationPipe) bodyDto: EnableOrDisableUserDto
    ) {
        return await this.usersService.enableOrDisableUser(id, bodyDto);
    }
}
