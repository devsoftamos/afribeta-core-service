export interface UploadFileOptions {
    key: string;
    body: Buffer;
    encoding?: string;
}

export interface UploadCompressedImageOptions extends UploadFileOptions {
    quality?: number;
    width?: number;
    height?: number;
    format?: "webp" | "jpeg" | "png";
}

export interface DeleteFileOptions {
    key: string;
}
