import { providusConfiguration } from "@/config";
import { Providus } from "@/libs/providus";
import { Global, Module } from "@nestjs/common";
import { ProvidusWorkflowService } from "./services";

@Global()
@Module({
    providers: [
        {
            provide: ProvidusWorkflowService,
            useFactory() {
                const providus = new Providus({
                    authSignature: providusConfiguration.authSignature,
                    baseUrl: providusConfiguration.clientId,
                    clientId: providusConfiguration.clientId,
                });
                return new ProvidusWorkflowService(providus);
            },
        },
    ],
})
export class ProvidusWorkflowModule {}
