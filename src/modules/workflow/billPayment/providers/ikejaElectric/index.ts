import { Global, Module } from "@nestjs/common";
import { IkejaElectricWorkflowService } from "./services";
import { ieConfig } from "@/config";
import IkejaElectric from "@calculusky/ikeja-electric-sdk";

@Global()
@Module({
    providers: [
        {
            provide: IkejaElectricWorkflowService,
            useFactory() {
                const ie = new IkejaElectric({
                    appId: ieConfig.appId,
                    cisPassword: ieConfig.cisPassword,
                    sftpPassword: ieConfig.sftpPassword,
                    sftpUsername: ieConfig.sftpUsername,
                    cisHost: ieConfig.cisHost,
                    cisPort: ieConfig.cisPort,
                    sftpHost: ieConfig.sftpHost,
                    sftpPort: ieConfig.sftpPort,
                    config: {
                        mode: ieConfig.config.mode,
                    },
                });
                return new IkejaElectricWorkflowService(ie);
            },
        },
    ],
    exports: [IkejaElectricWorkflowService],
})
export class IkejaElectricWorkflowModule {}
