import {
    Body,
    Controller,
    Get,
    Patch,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { CommissionService } from "../../services";
import { AuthGuard, IsEnabledGuard } from "@/modules/api/auth/guard";
import { UpdateSingleBillCommissionDto } from "../../dtos";
import * as Ability from "@/modules/core/ability";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import { CheckAbilities } from "@/modules/core/ability/decorator";

@UseGuards(AuthGuard, IsEnabledGuard)
@Controller({
    path: "admin/commission",
})
export class AdminCommissionController {
    constructor(private readonly commissionService: CommissionService) {}

    @Get()
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadCommissionAbility())
    async adminGetAgencyServiceCommissions() {
        return await this.commissionService.adminGetAgencyServiceCommissions();
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
    @Patch("agent/single-billservice")
    @CheckAbilities(new Ability.UpdateCommissionAbility())
    async updateSingleBillServiceBaseCommission(
        @Body(ValidationPipe)
        updateSingleBillServiceBaseCommissionDto: UpdateSingleBillCommissionDto
    ) {
        return await this.commissionService.updateSingleBillServiceBaseCommission(
            updateSingleBillServiceBaseCommissionDto
        );
    }
}
