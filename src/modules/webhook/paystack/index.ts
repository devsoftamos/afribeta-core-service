import { BillModule } from "@/modules/api/bill";
import { WalletModule } from "@/modules/api/wallet";
import { Module } from "@nestjs/common";
import { PaystackWebhookController } from "./controllers";
import { PaystackWebhookEvent } from "./events";
import { PaystackWebhookService } from "./services";
export * from "./interfaces";

@Module({
    imports: [WalletModule, BillModule],
    providers: [PaystackWebhookService, PaystackWebhookEvent],
    controllers: [PaystackWebhookController],
})
export class PaystackWebhookModule {}
