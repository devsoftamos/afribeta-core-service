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
} from "@nestjs/common";
import {
    CreateUserDto,
    FetchAllMerchantsDto,
    FetchMerchantAgentsDto,
    ListMerchantAgentsDto,
} from "../../dtos";
import { User as UserModel } from "@prisma/client";
import { UserService } from "../../services";
import { AuthGuard } from "@/modules/api/auth/guard";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/user",
})
export class AdminUserController {
    constructor(private readonly usersService: UserService) {}

    @Get("merchant")
    async fetchMerchants(
        @Query(ValidationPipe) fetchMerchantsDto: FetchMerchantAgentsDto
    ) {
        return await this.usersService.fetchMerchants(fetchMerchantsDto);
    }

    @Get("customer")
    async fetchCustomers(
        @Query(ValidationPipe) fetchCustomersDto: ListMerchantAgentsDto
    ) {
        return await this.usersService.fetchCustomers(fetchCustomersDto);
    }

    @Get("merchant/:id")
    async getMerchantDetails(@Param("id", ParseIntPipe) id: number) {
        return await this.usersService.merchantDetails(id);
    }

    @Get("merchant/:id/agent")
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
    async fetchAllMerchants(
        @Query(ValidationPipe) fetchAllMerchantsDto: FetchAllMerchantsDto
    ) {
        return await this.usersService.getAllMerchants(fetchAllMerchantsDto);
    }

    @Get("list-users")
    async fetchAllUsers(
        @Query(ValidationPipe) fetchAllUsersDto: ListMerchantAgentsDto
    ) {
        return await this.usersService.fetchAllUsers(fetchAllUsersDto);
    }

    @Post("create-user")
    async createUser(@Body(ValidationPipe) createUserDto: CreateUserDto) {
        return await this.usersService.createNewUser(createUserDto);
    }
}
