import { NetworkDataProvider } from "@/modules/workflow/billPayment";
import { IsEnum } from "class-validator";

export class GetDataBundleDto {
    @IsEnum(NetworkDataProvider)
    networkProvider: NetworkDataProvider;
}
