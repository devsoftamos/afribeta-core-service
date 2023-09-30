import { WalletModule } from "@/modules/api/wallet";
import { Module } from "@nestjs/common";
import { FSDH360BankWebhookController } from "./controllers";
import { FSDH360BankWebhookEvent } from "./events";
import { FSDH360BankWebhookService } from "./services";
export * from "./interfaces";

@Module({
    imports: [WalletModule],
    providers: [FSDH360BankWebhookService, FSDH360BankWebhookEvent],
    controllers: [FSDH360BankWebhookController],
})
export class FSDH360BankWebhookModule {}
