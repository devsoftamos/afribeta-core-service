import { azureConfiguration } from "@/config";
import { Global, Module } from "@nestjs/common";
import { AzureStorageService } from "./services/azure";

@Global()
@Module({
    providers: [
        {
            provide: AzureStorageService,
            useFactory() {
                return new AzureStorageService(azureConfiguration);
            },
        },
    ],
    exports: [AzureStorageService],
})
export class UploadModule {}
