import { AzureConfiguration } from "@/config";
import { BlobServiceClient, BlockBlobClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { Injectable } from "@nestjs/common";
import { UploadCompressedImageOptions, UploadFileOptions } from "../s3";
import * as sharp from "sharp";

@Injectable()
export class AzureService {
    constructor(private readonly azureConfiguration: AzureConfiguration) {}

    async azureUploadCompressedImage(
        options: UploadCompressedImageOptions
    ): Promise<string> {
        const quality = { quality: options.quality };
        const resizedBody = sharp(options.body).resize({
            width: options.width,
            height: options.height,
        });

        const compressedFormat = () => {
            switch (true) {
                case options.format == "webp": {
                    return resizedBody.webp(quality);
                }
                case options.format == "jpeg": {
                    return resizedBody.jpeg(quality);
                }

                default: {
                    return resizedBody.png(quality);
                }
            }
        };
        const compressedBuffer = await compressedFormat().toBuffer();
        const connectionString = `DefaultEndpointsProtocol=https;AccountName=${this.azureConfiguration.storageName};AccountKey=${this.azureConfiguration.storageKey};EndpointSuffix=core.windows.net`;
        const blobServiceClient =
            BlobServiceClient.fromConnectionString(connectionString);

        const containerName = this.azureConfiguration.storageContainer;
        const containerClient =
            blobServiceClient.getContainerClient(containerName);

        const blobName = options.key;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadData(options.body);
        const blobUrl = containerClient.getBlobClient(blobName).url;
        return blobUrl;
    }
}
