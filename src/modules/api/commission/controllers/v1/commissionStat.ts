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
import { User } from "@/modules/api/user";
import { User as UserModel } from "@prisma/client";
import { AuthGuard } from "@/modules/api/auth/guard";

@UseGuards(AuthGuard)
@Controller({
    path: "commission/statistics",
})
@Injectable()
export class CommissionStatController {
    constructor(
        private readonly commissionStatService: CommissionStatService
    ) {}

    @Get()
    async GetMerchantTotalCommission(
        @Query(ValidationPipe)
        fetchCommissionDto: FetchCommissionDto,
        @User() user: UserModel
    ) {
        return await this.commissionStatService.fetchMerchantTotalCommission(
            fetchCommissionDto,
            user
        );
    }
}
