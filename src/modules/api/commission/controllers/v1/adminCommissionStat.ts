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
import { AuthGuard } from "@/modules/api/auth/guard";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/commission/statistics",
})
@Injectable()
export class AdminCommissionStatController {
    constructor(
        private readonly commissionStatService: CommissionStatService
    ) {}

    @Get()
    async GetTotalCommission(
        @Query(ValidationPipe)
        fetchCommissionDto: FetchCommissionDto
    ) {
        return await this.commissionStatService.fetchTotalCommission(
            fetchCommissionDto
        );
    }
}
