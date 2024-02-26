import * as S3 from "aws-sdk/clients/s3";
import {
    CompressImageOptions,
    DeleteFileOptions,
    IUploadService,
    UploadImageOptions,
} from "../interfaces";
import { BaseUploadService } from "./base";
import { BuildKey } from "../interfaces/oceanSpace";
import { OceanSpaceConfiguration } from "@/config";

export class OceanSpaceService
    extends BaseUploadService
    implements IUploadService
{
    constructor(
        private readonly s3: S3,
        private oceanSpaceConfiguration: OceanSpaceConfiguration
    ) {
        super();
    }

    private buildKey(options: BuildKey): string {
        return `${options.dir}/${options.name}.${options.format}`;
    }

    async uploadImage(options: UploadImageOptions): Promise<string> {
        const key = this.buildKey({
            dir: options.dir,
            name: options.name,
            format: options.format,
        });
        const params: S3.PutObjectRequest = {
            Bucket: this.oceanSpaceConfiguration.bucketName,
            ContentEncoding: options.encoding ?? "base64",
            Key: key,
            Body: options.body,
            ACL: "public-read",
        };

        const data = await this.s3.upload(params).promise();
        return data.Location;
    }

    async uploadCompressedImage(
        options: CompressImageOptions
    ): Promise<string> {
        const key = this.buildKey({
            dir: options.dir,
            name: options.name,
            format: options.format,
        });
        const compressedBuffer = await this.compressImage(options);
        const params: S3.PutObjectRequest = {
            Bucket: this.oceanSpaceConfiguration.bucketName,
            ContentEncoding: options.encoding ?? "base64",
            Key: key,
            Body: compressedBuffer,
            ACL: "public-read",
        };

        const data = await this.s3.upload(params).promise();
        return data.Location;
    }

    async deleteFile(options: DeleteFileOptions) {
        const params: S3.DeleteObjectRequest = {
            Bucket: this.oceanSpaceConfiguration.bucketName,
            Key: options.key,
        };
        await this.s3.deleteObject(params).promise();
        return true;
    }
}
