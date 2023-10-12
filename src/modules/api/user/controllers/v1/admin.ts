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
}
