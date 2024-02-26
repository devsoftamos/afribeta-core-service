import { BuildOptions } from "../interfaces";
import * as S3 from "aws-sdk/clients/s3";
import { oceanSpaceConfiguration } from "@/config";
import { OceanSpaceService } from "./oceanSpace";

export class UploadFactory {
    build(options: BuildOptions) {
        switch (options.provider) {
            case "ocean_space": {
                const s3 = new S3({
                    region: oceanSpaceConfiguration.region,
                    credentials: {
                        accessKeyId: oceanSpaceConfiguration.accessKey,
                        secretAccessKey: oceanSpaceConfiguration.secretKey,
                    },
                    endpoint: oceanSpaceConfiguration.endpoint,
                });
                return new OceanSpaceService(s3, oceanSpaceConfiguration);
            }

            default:
                break;
        }
    }
}
