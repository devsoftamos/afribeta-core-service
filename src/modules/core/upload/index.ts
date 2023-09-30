import { awsConfiguration } from "@/config";
import { Global, Module } from "@nestjs/common";
import { S3Service } from "./services/s3";

@Global()
@Module({
    providers: [
        {
            provide: S3Service,
            useFactory() {
                return new S3Service(awsConfiguration);
            },
        },
    ],
    exports: [S3Service],
})
export class UploadModule {}
