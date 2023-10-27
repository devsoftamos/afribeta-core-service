export type ImageFormat = "webp" | "jpeg" | "png";

export interface UploadFileOptions {
    dir: string;
    name: string;
    body: Buffer;
    encoding?: string;
    format: ImageFormat;
}

export interface CompressImageOptions extends UploadFileOptions {
    quality?: number;
    width?: number;
    height?: number;
}

export interface DeleteFileOptions {
    blobUrl: string;
    dir: string;
}

export interface IUploadService {
    uploadFile(options: UploadFileOptions): Promise<string>;
    uploadCompressedImage(options: CompressImageOptions): Promise<string>;
}
