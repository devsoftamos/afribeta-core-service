import { Global, Module } from "@nestjs/common";
import { TransactionController } from "./controllers/v1";
import { TransactionService } from "./services";
import { AdminTransactionController } from "./controllers/v1/admin";
import { TransactionStatService } from "./services/transactionStat";
import { TransactionStatController } from "./controllers/v1/transactionStat";
import { AdminTransactionStatController } from "./controllers/v1/adminTransactionStat";
export * from "./interfaces";
export * from "./errors";
@Global()
@Module({
    controllers: [
        TransactionController,
        AdminTransactionController,
        TransactionStatController,
        AdminTransactionStatController,
    ],
    providers: [TransactionService, TransactionStatService],
    exports: [TransactionService],
})
export class TransactionModule {}
