import { Module } from "@nestjs/common";
import { CommissionController } from "./controllers/v1";
import { CommissionService } from "./services";

@Module({
    controllers: [CommissionController],
    providers: [CommissionService],
})
export class CommissionModule {}
