import { Module } from "@nestjs/common";
import { BillController } from "./controllers/v1";
import { AirtimeBillController } from "./controllers/v1/airtime";
import { CableTVBillController } from "./controllers/v1/cabletv";
import { DataBillController } from "./controllers/v1/data";
import { InternetBillController } from "./controllers/v1/internet";
import { PowerBillController } from "./controllers/v1/power";
import { BillEvent } from "./events";
import { BillService } from "./services";
import { AirtimeBillService } from "./services/airtime";
import { CableTVBillService } from "./services/cabletv";
import { DataBillService } from "./services/data";
import { InternetBillService } from "./services/internet";
import { PowerBillService } from "./services/power";
import { BullModule } from "@nestjs/bull";
import { billBoardQueueConfig, billQueueConfig } from "./queues";
import { BuypowerReQueryQueueProcessor } from "./queues/processors";
import { BullBoardModule } from "@bull-board/nestjs";
import { AdminBillController } from "./controllers/v1/admin";
@Module({
    imports: [
        BullModule.registerQueue(...billQueueConfig),
        BullBoardModule.forFeature(...billBoardQueueConfig),
    ],
    providers: [
        BillService,
        PowerBillService,
        DataBillService,
        BillEvent,
        AirtimeBillService,
        InternetBillService,
        CableTVBillService,
        BuypowerReQueryQueueProcessor,
    ],
    controllers: [
        BillController,
        DataBillController,
        PowerBillController,
        AirtimeBillController,
        InternetBillController,
        CableTVBillController,
        AdminBillController,
    ],
    exports: [BillService],
})
export class BillModule {}
