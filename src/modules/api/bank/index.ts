import { Module } from "@nestjs/common";
import { BankController } from "./controllers/v1";
import { BankService } from "./services";

@Module({
    controllers: [BankController],
    providers: [BankService],
})
export class BankModule {}
