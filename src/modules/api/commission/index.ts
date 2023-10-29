import { Module } from "@nestjs/common";
import { CommissionController } from "./controllers/v1";
import { CommissionService } from "./services";
import { AdminCommissionController } from "./controllers/v1/admin";
import { CommissionStatService } from "./services/commissionStat";
import { CommissionStatController } from "./controllers/v1/commissionStat";
import { AdminCommissionStatController } from "./controllers/v1/adminCommissionStat";

@Module({
    controllers: [
        CommissionController,
        AdminCommissionController,
        CommissionStatController,
        AdminCommissionStatController,
    ],
    providers: [CommissionService, CommissionStatService],
})
export class CommissionModule {}
