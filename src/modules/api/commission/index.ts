import { Module } from "@nestjs/common";
import { CommissionController } from "./controllers/v1";
import { CommissionService } from "./services";
import { AdminCommissionController } from "./controllers/v1/admin";

@Module({
    controllers: [CommissionController, AdminCommissionController],
    providers: [CommissionService],
})
export class CommissionModule {}
