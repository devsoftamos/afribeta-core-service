import { providusConfiguration } from "@/config";
import { Providus } from "@/libs/providus";
import { Global, Module } from "@nestjs/common";
import { ProvidusService } from "./services";

@Global()
@Module({
    providers: [
        {
            provide: ProvidusService,
            useFactory() {
                const providus = new Providus({
                    authSignature: providusConfiguration.authSignature,
                    baseUrl: providusConfiguration.baseUrl,
                    clientId: providusConfiguration.clientId,
                });
                return new ProvidusService(providus);
            },
        },
    ],
    exports: [ProvidusService],
})
export class ProvidusWorkflowModule {}
