import { Module } from "@nestjs/common";
import { BillController } from "./controllers/v1";
import { BillService } from "./services";
import { PowerBillService } from "./services/power";

@Module({
    providers: [BillService, PowerBillService],
    controllers: [BillController],
    exports: [BillService],
})
export class BillModule {}
