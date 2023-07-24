import { Module } from "@nestjs/common";
import { BillController } from "./controllers/v1";
import { AirtimeBillController } from "./controllers/v1/airtime";
import { DataBillController } from "./controllers/v1/data";
import { PowerBillController } from "./controllers/v1/power";
import { BillEvent } from "./events";
import { BillService } from "./services";
import { AirtimeBillService } from "./services/airtime";
import { DataBillService } from "./services/data";
import { PowerBillService } from "./services/power";

@Module({
    providers: [
        BillService,
        PowerBillService,
        DataBillService,
        BillEvent,
        AirtimeBillService,
    ],
    controllers: [
        BillController,
        DataBillController,
        PowerBillController,
        AirtimeBillController,
    ],
    exports: [BillService],
})
export class BillModule {}
