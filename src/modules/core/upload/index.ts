import { awsConfiguration, azureConfiguration } from "@/config";
import { Global, Module } from "@nestjs/common";
import { S3Service } from "./services/s3";
import { AzureService } from "./services/azure";

@Global()
@Module({
    providers: [
        {
            provide: S3Service,
            useFactory() {
                return new S3Service(awsConfiguration);
            },
        },

        {
            provide: AzureService,
            useFactory() {
                return new AzureService(azureConfiguration);
            },
        },
    ],
    exports: [S3Service, AzureService],
})
export class UploadModule {}
