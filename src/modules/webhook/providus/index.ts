import { WalletModule } from "@/modules/api/wallet";
import {
    MiddlewareConsumer,
    Module,
    NestModule,
    RequestMethod,
} from "@nestjs/common";
import { ProvidusWebhookController } from "./controllers";
import { ProvidusWebhookMiddleware } from "./middleware";
import { ProvidusWebhookService } from "./services";

@Module({
    imports: [WalletModule],
    providers: [ProvidusWebhookService, ProvidusWebhookMiddleware],
    controllers: [ProvidusWebhookController],
})
export class ProvidusWebhookModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ProvidusWebhookMiddleware).forRoutes({
            path: "webhook/providus",
            method: RequestMethod.POST,
        });
    }
}
