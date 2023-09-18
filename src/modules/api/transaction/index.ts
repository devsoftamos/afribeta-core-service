import { Global, Module } from "@nestjs/common";
import { TransactionController } from "./controllers/v1";
import { TransactionService } from "./services";
import { AdminTransactionController } from "./controllers/v1/admin";
export * from "./interfaces";
export * from "./errors";
@Global()
@Module({
    controllers: [TransactionController, AdminTransactionController],
    providers: [TransactionService],
    exports: [TransactionService],
})
export class TransactionModule {}
