import { WalletModule } from "@/modules/api/wallet";
import { Module } from "@nestjs/common";
import { PaystackWebhookController } from "./controllers";
import { PaystackWebhookService } from "./services";
export * from "./interfaces";

@Module({
    imports: [WalletModule],
    providers: [PaystackWebhookService],
    controllers: [PaystackWebhookController],
})
export class PaystackWebhookModule {}
