import {
    Controller,
    Get,
    Param,
    UseGuards,
    ParseIntPipe,
    Body,
    ValidationPipe,
    Patch,
    Delete,
} from "@nestjs/common";
import { CommissionService } from "../../services";
import { User } from "@/modules/api/user";
import { User as UserModel } from "@prisma/client";
import { AuthGuard, EnabledAccountGuard } from "@/modules/api/auth/guard";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import * as Ability from "@/modules/core/ability";
import {
    DeleteSubagentCommissionDto,
    UpdateSubagentCommissionDto,
} from "../../dtos";

@UseGuards(AuthGuard, EnabledAccountGuard)
@Controller({
    path: "commission",
})
export class CommissionController {
    constructor(private readonly commissionService: CommissionService) {}

    @Get()
    async getUserBillCommissions(@User() user: UserModel) {
        return await this.commissionService.getServiceCommissions(user);
    }

    @Get("subagent/:id")
    @CheckAbilities(new Ability.ViewSubAgentAbility())
    async merchantGetSubagentsBillCommissions(
        @Param("id", ParseIntPipe) id: number,
        @User() user: UserModel
    ) {
        return await this.commissionService.merchantGetSubagentsBillCommissions(
            user,
            id
        );
    }

    @Patch("subagent/:id")
    @CheckAbilities(new Ability.UpdateSubAgentAbility())
    async merchantUpdateSubagentCommission(
        @Param("id", ParseIntPipe) id: number,
        @Body(ValidationPipe)
        updateSubagentCommissionDto: UpdateSubagentCommissionDto,
        @User()
        user: UserModel
    ) {
        return await this.commissionService.merchantUpdateSubagentCommission(
            id,
            updateSubagentCommissionDto,
            user
        );
    }

    @Delete("subagent/:id")
    @CheckAbilities(new Ability.DeleteSubAgentAbility())
    async merchantDeleteSubagentCommission(
        @Param("id", ParseIntPipe) id: number,
        @Body(ValidationPipe)
        deleteSubagentCommissionDto: DeleteSubagentCommissionDto,
        @User()
        user: UserModel
    ) {
        return await this.commissionService.merchantDeleteSubagentCommission(
            id,
            deleteSubagentCommissionDto,
            user
        );
    }
}
