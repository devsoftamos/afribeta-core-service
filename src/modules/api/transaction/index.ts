import { Global, Module } from "@nestjs/common";
import { TransactionController } from "./controllers/v1";
import { TransactionService } from "./services";
export * from "./interfaces";

@Global()
@Module({
    controllers: [TransactionController],
    providers: [TransactionService],
    exports: [TransactionService],
})
export class TransactionModule {}
