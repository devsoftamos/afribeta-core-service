import { Module } from "@nestjs/common";
import { BillController } from "./controllers/v1";
import { DataController } from "./controllers/v1/data";
import { BillPowerController } from "./controllers/v1/power";
import { BillEvent } from "./events";
import { BillService } from "./services";
import { DataBillService } from "./services/data";
import { PowerBillService } from "./services/power";

@Module({
    providers: [BillService, PowerBillService, DataBillService, BillEvent],
    controllers: [BillController, DataController, BillPowerController],
    exports: [BillService],
})
export class BillModule {}
