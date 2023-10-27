import { AzureConfiguration } from "@/config";
import {
    BlobClient,
    BlobServiceClient,
    BlockBlobClient,
} from "@azure/storage-blob";
import { Injectable } from "@nestjs/common";
import {
    CompressImageOptions,
    DeleteFileOptions,
    IUploadService,
    ImageFormat,
    UploadFileOptions,
} from "../interfaces";
import { BaseUploadService } from "./base";

@Injectable()
export class AzureStorageService
    extends BaseUploadService
    implements IUploadService
{
    constructor(private readonly azureConfiguration: AzureConfiguration) {
        super();
    }

    private buildConnectionString() {
        return `DefaultEndpointsProtocol=https;AccountName=${this.azureConfiguration.storageName};AccountKey=${this.azureConfiguration.storageKey};EndpointSuffix=core.windows.net`;
    }

    private buildBlobName(name: string, format: ImageFormat) {
        return `${name}.${format}`;
    }

    private getBlockBlobClient(
        blobName: string,
        containerName: string
    ): BlockBlobClient {
        const connectionString = this.buildConnectionString();
        const blobServiceClient =
            BlobServiceClient.fromConnectionString(connectionString);
        const containerClient =
            blobServiceClient.getContainerClient(containerName);
        return containerClient.getBlockBlobClient(blobName);
    }

    private getBlobClient(blobName: string, containerName: string): BlobClient {
        const connectionString = this.buildConnectionString();
        const blobServiceClient =
            BlobServiceClient.fromConnectionString(connectionString);
        const containerClient =
            blobServiceClient.getContainerClient(containerName);
        return containerClient.getBlobClient(blobName);
    }

    async uploadFile(options: UploadFileOptions): Promise<string> {
        const blobName = this.buildBlobName(options.name, options.format);
        const blockBlobClient = this.getBlockBlobClient(blobName, options.dir);
        await blockBlobClient.uploadData(options.body);
        return blockBlobClient.url;
    }

    async uploadCompressedImage(
        options: CompressImageOptions
    ): Promise<string> {
        const blobName = this.buildBlobName(options.name, options.format);
        const compressedBuffer = await this.compressImage(options);

        const blockBlobClient = this.getBlockBlobClient(blobName, options.dir);
        await blockBlobClient.uploadData(compressedBuffer);
        return blockBlobClient.url;
    }

    async deleteFile(options: DeleteFileOptions): Promise<boolean> {
        const blobUrl = options.blobUrl;
        const blobName = blobUrl.split("/").slice(-1)[0];
        const blobClient = this.getBlobClient(blobName, options.dir);
        await blobClient.delete({
            deleteSnapshots: "include",
        });
        return true;
    }
}
