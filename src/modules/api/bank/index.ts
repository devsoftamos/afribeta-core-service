import { Module } from "@nestjs/common";
import { BankController } from "./controllers/v1";
import { BankService } from "./services";
export * from "./errors";

@Module({
    controllers: [BankController],
    providers: [BankService],
})
export class BankModule {}
