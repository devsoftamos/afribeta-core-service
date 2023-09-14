import { User } from "../../decorators";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import {
    Body,
    Controller,
    Param,
    Get,
    Patch,
    Post,
    Query,
    ParseIntPipe,
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

@UseGuards(AuthGuard)
@Controller({
    path: "admin/user",
})
export class AdminUserController {
    constructor(private readonly usersService: UserService) {}

    @Get("merchants")
  
    async fetchMerchants(
        @Query(ValidationPipe) fetchMerchantsDto: FetchMerchantAgentsDto,
        @User() user: UserModel
    ) {
        return await this.usersService.fetchMerchants(fetchMerchantsDto, user);
    }

    @Get("customers")
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

    @Get("merchant/:userId/view-agents")
    async fetchMerchantAgents(
        @Query(ValidationPipe) fetchMerchantsAgentDto: ListMerchantAgentsDto,
        @User() user: UserModel,
        @Param("userId", ParseIntPipe) userId: number
    ) {
        return await this.usersService.getMerchantAgents(
            fetchMerchantsAgentDto,
            user,
            userId
        );
    }
}
