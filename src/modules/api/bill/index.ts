import { Module } from "@nestjs/common";
import { BillController } from "./controllers/v1";
import { BillService } from "./services";

@Module({
    providers: [BillService],
    controllers: [BillController],
})
export class BillModule {}
