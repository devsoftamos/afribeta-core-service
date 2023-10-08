import {
    Body,
    Controller,
    Get,
    Patch,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { CommissionService } from "../../services";
import { AuthGuard } from "@/modules/api/auth/guard";
import { UpdateSingleBillCommissionDto } from "../../dtos";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/commission",
})
export class CommissionController {
    constructor(private readonly commissionService: CommissionService) {}

    @Get()
    async adminGetAgencyServiceCommissions() {
        return await this.commissionService.adminGetAgencyServiceCommissions();
    }

    @Patch("agent/single-billservice")
    async updateDefaultAgentSingleBillCommission(
        @Body(ValidationPipe)
        updateDefaultAgentSingleBillCommissionDto: UpdateSingleBillCommissionDto
    ) {
        return await this.commissionService.updateDefaultAgentSingleBillCommission(
            updateDefaultAgentSingleBillCommissionDto
        );
    }

    @Patch("base/single-billservice")
    async updateSingleBillServiceBaseCommission(
        @Body(ValidationPipe)
        updateSingleBillServiceBaseCommissionDto: UpdateSingleBillCommissionDto
    ) {
        return await this.commissionService.updateSingleBillServiceBaseCommission(
            updateSingleBillServiceBaseCommissionDto
        );
    }
}
