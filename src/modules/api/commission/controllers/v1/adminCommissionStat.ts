import {
    Controller,
    Get,
    Injectable,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { CommissionStatService } from "../../services/commissionStat";
import { FetchCommissionDto } from "../../dtos";
import { AuthGuard, EnabledAccountGuard } from "@/modules/api/auth/guard";
import { AbilitiesGuard } from "@/modules/core/ability/guards";
import { CheckAbilities } from "@/modules/core/ability/decorator";
import * as Ability from "@/modules/core/ability";

@UseGuards(AuthGuard, EnabledAccountGuard)
@Controller({
    path: "admin/commission/statistics",
})
@Injectable()
export class AdminCommissionStatController {
    constructor(
        private readonly commissionStatService: CommissionStatService
    ) {}

    @Get()
    @UseGuards(AbilitiesGuard)
    @CheckAbilities(new Ability.ReadCommissionAbility())
    async GetTotalCommission(
        @Query(ValidationPipe)
        fetchCommissionDto: FetchCommissionDto
    ) {
        return await this.commissionStatService.fetchTotalCommission(
            fetchCommissionDto
        );
    }
}
