import { Module } from "@nestjs/common";
import { WalletController } from "./controllers/v1";
import { WalletService } from "./services";
import { AdminWalletController } from "./controllers/v1/admin";
export * from "./interfaces";
export * from "./errors";

@Module({
    controllers: [WalletController, AdminWalletController],
    providers: [WalletService],
    exports: [WalletService],
})
export class WalletModule {}
