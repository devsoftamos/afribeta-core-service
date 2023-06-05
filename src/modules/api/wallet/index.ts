import { Module } from "@nestjs/common";
import { WalletController } from "./controllers/v1";
import { WalletService } from "./services";
export * from "./interfaces";
export * from "./errors";

@Module({
    controllers: [WalletController],
    providers: [WalletService],
    exports: [WalletService],
})
export class WalletModule {}
