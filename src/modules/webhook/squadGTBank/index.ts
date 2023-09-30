import { WalletModule } from "@/modules/api/wallet";
import { Module } from "@nestjs/common";
import { SquadGTBankWebhookController } from "./controllers";
import { SquadGTBankWebhookEvent } from "./events";
import { SquadGTBankWebhookService } from "./services";
export * from "./interfaces";

@Module({
    imports: [WalletModule],
    providers: [SquadGTBankWebhookService, SquadGTBankWebhookEvent],
    controllers: [SquadGTBankWebhookController],
})
export class SquadGTBankWebhookModule {}
