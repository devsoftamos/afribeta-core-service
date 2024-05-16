import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { CommissionService } from "../../services";
import { AuthGuard } from "@/modules/api/auth/guard";
import {
    ListAgentCommissionDto,
    UpdateMerchantSingleBillCommissionDto,
    UpdateSingleBillCommissionDto,
} from "../../dtos";
import * as Ability from "@/modules/core/ability";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import { CheckAbilities } from "@/modules/core/ability/decorator";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/commission",
})
export class AdminCommissionController {
    constructor(private readonly commissionService: CommissionService) {}

    @Get()
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadCommissionAbility())
    async adminGetAgencyServiceCommissions(
        @Query() queryDto: ListAgentCommissionDto
    ) {
        return await this.commissionService.adminGetAgencyServiceCommissions(
            queryDto
        );
    }

    @Patch("agent/single-billservice")
    @CheckAbilities(new Ability.UpdateCommissionAbility())
    async updateDefaultAgentSingleBillCommission(
        @Body(ValidationPipe)
        updateDefaultAgentSingleBillCommissionDto: UpdateSingleBillCommissionDto
    ) {
        return await this.commissionService.updateDefaultAgentSingleBillCommission(
            updateDefaultAgentSingleBillCommissionDto
        );
    }

    @Patch("base/single-billservice")
    @CheckAbilities(new Ability.UpdateCommissionAbility())
    async updateSingleBillServiceBaseCommission(
        @Body(ValidationPipe)
        updateSingleBillServiceBaseCommissionDto: UpdateSingleBillCommissionDto
    ) {
        return await this.commissionService.updateSingleBillServiceBaseCommission(
            updateSingleBillServiceBaseCommissionDto
        );
    }

    @Get("merchant/:id")
    async fetchMerchantCommission(@Param("id", ParseIntPipe) id: number) {
        return await this.commissionService.fetchMerchantCommission(id);
    }

    @Patch("merchant/:id")
    @CheckAbilities(new Ability.UpdateCommissionAbility())
    async updateMerchantSingleBillCommission(
        @Param("id", ParseIntPipe) id: number,
        @Body()
        bodyDto: UpdateMerchantSingleBillCommissionDto
    ) {
        return await this.commissionService.updateMerchantSingleCommission(
            id,
            bodyDto
        );
    }
}
