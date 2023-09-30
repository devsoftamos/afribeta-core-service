import { Injectable } from "@nestjs/common";
import { AWSConfiguration } from "@/config";
import * as S3 from "aws-sdk/clients/s3";
import {
    DeleteFileOptions,
    UploadCompressedImageOptions,
    UploadFileOptions,
} from "./interfaces";
export * from "./interfaces";
import * as sharp from "sharp";

@Injectable()
export class S3Service {
    private s3: S3;
    constructor(private readonly awsConfiguration: AWSConfiguration) {
        this.s3 = new S3({
            region: this.awsConfiguration.region,
            credentials: {
                accessKeyId: this.awsConfiguration.accessKeyId,
                secretAccessKey: this.awsConfiguration.secretAccessKey,
            },
        });
    }

    async uploadFile(options: UploadFileOptions): Promise<string> {
        const params: S3.PutObjectRequest = {
            Bucket: this.awsConfiguration.s3Bucket,
            ContentEncoding: options.encoding ?? "base64",
            Key: options.key,
            Body: options.body,
        };

        const data = await this.s3.upload(params).promise();
        return data.Location;
    }

    async uploadCompressedImage(
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
        const params: S3.PutObjectRequest = {
            Bucket: this.awsConfiguration.s3Bucket,
            ContentEncoding: options.encoding ?? "base64",
            Key: options.key,
            Body: compressedBuffer,
        };

        const data = await this.s3.upload(params).promise();
        return data.Location;
    }

    async deleteFile(options: DeleteFileOptions) {
        const params: S3.DeleteObjectRequest = {
            Bucket: this.awsConfiguration.s3Bucket,
            Key: options.key,
        };
        console.log(params);
        return await this.s3.deleteObject(params).promise();
    }
}
