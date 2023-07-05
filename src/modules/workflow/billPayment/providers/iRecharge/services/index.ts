import { DiscoBundleData, IRecharge } from "@/libs/iRecharge";
import { IRechargeError } from "@/libs/iRecharge/errors";
import { HttpStatus, Injectable } from "@nestjs/common";
import logger from "moment-logger";
import {
    FormattedElectricDiscoData,
    GetMeterInfoOptions,
    GetMeterResponse,
    MeterType,
} from "../../../interfaces";
import {
    IRechargeElectricityException,
    IRechargeWorkflowException,
} from "../errors";

@Injectable()
export class IRechargeWorkflowService {
    constructor(private iRecharge: IRecharge) {}

    private blackListedDiscos: string[] = [
        "Ikeja_Electric_Bill_Payment",
        "Ikeja_Token_Purchase",
    ];

    async getElectricDiscos(
        provider: string
    ): Promise<FormattedElectricDiscoData[]> {
        try {
            const resData = await this.iRecharge.getElectricDiscos();
            if (!resData || !resData.bundles) {
                throw new IRechargeWorkflowException(
                    "Unable to retrieve electric discos. Please try again",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            const bundle = resData.bundles.filter((bundle) => {
                return !this.blackListedDiscos.includes(bundle.code);
            });
            const data = this.formatElectricDiscoData(bundle, provider);
            return data;
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof IRechargeError: {
                    throw new IRechargeElectricityException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
                case error instanceof IRechargeWorkflowException: {
                    throw error;
                }

                default: {
                    throw new IRechargeWorkflowException(
                        "Failed to retrieve electric discos. Error ocurred",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    private formatElectricDiscoData(
        bundles: DiscoBundleData[],
        provider: string
    ): FormattedElectricDiscoData[] {
        const formattedBundles: FormattedElectricDiscoData[] = bundles.map(
            (bundle) => {
                const discoType = bundle.description
                    .replace(/Postpaid/gi, "")
                    .replace(/Prepaid/gi, "")
                    .replace(/_/gi, " ")
                    .trim();
                const data = {
                    code: bundle.code,
                    discoType: discoType,
                    maxValue: +bundle.maximum_value,
                    minValue: +bundle.minimum_value,
                    billProvider: provider,
                    meterType: MeterType.POSTPAID,
                };
                if (
                    bundle.description.search(/Postpaid/gi) > -1 ||
                    bundle.code.search(/Postpaid/gi) > -1
                ) {
                    return data;
                } else {
                    data.meterType = MeterType.PREPAID;
                    return data;
                }
            }
        );
        return formattedBundles;
    }

    async getMeterInfo(
        options: GetMeterInfoOptions
    ): Promise<GetMeterResponse> {
        try {
            const getMeterInfo = await this.iRecharge.getMeterInfo({
                disco: options.discoType,
                meter: options.meterNumber,
                hash: "bbb",
                reference_id: options.reference,
            });
            return {
                accessToken: getMeterInfo.access_token,
                hash: getMeterInfo.response_hash,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof IRechargeError: {
                    const clientErrorCodes = ["13", "14", "15", "41"];
                    if (clientErrorCodes.includes(error.status)) {
                        throw new IRechargeElectricityException(
                            error.message,
                            HttpStatus.BAD_REQUEST
                        );
                    }

                    throw new IRechargeElectricityException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
                case error instanceof IRechargeWorkflowException: {
                    throw error;
                }

                default: {
                    throw new IRechargeWorkflowException(
                        "Failed to retrieve electric discos. Error ocurred",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }
}
