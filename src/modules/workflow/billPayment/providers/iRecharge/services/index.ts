import { DiscoBundleData, IRecharge } from "@/libs/iRecharge";
import { IRechargeError } from "@/libs/iRecharge/errors";
import { DataBundleProvider } from "@/libs/iRecharge/interfaces/data";
import { HttpStatus, Injectable } from "@nestjs/common";
import logger from "moment-logger";
import {
    NetworkDataProvider,
    FormattedElectricDiscoData,
    GetDataBundleResponse,
    GetMeterInfoOptions,
    GetMeterResponse,
    MeterType,
    VendPowerOptions,
    VendPowerResponse,
    VendDataOptions,
    VendDataResponse,
} from "../../../interfaces";
import {
    IRechargeDataException,
    IRechargeGetMeterInfoException,
    IRechargePowerException,
    IRechargeVendDataException,
    IRechargeVendPowerException,
} from "../errors";

@Injectable()
export class IRechargeWorkflowService {
    public provider = "irecharge";
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
                throw new IRechargePowerException(
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
                    throw new IRechargePowerException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
                case error instanceof IRechargePowerException: {
                    throw error;
                }

                default: {
                    throw new IRechargePowerException(
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
            const hash = this.iRecharge.getMeterInfoHash({
                disco: options.discoCode,
                meterNumber: options.meterNumber,
                referenceId: options.reference,
            });

            //console.log(hash);

            const getMeterInfo = await this.iRecharge.getMeterInfo({
                disco: options.discoCode,
                meter: options.meterNumber,
                hash: hash,
                reference_id: options.reference,
            });

            if (!getMeterInfo || !getMeterInfo.customer) {
                throw new IRechargeGetMeterInfoException(
                    "Failed to retrieve meter information",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return {
                accessToken: getMeterInfo.access_token,
                hash: getMeterInfo.response_hash,
                customer: {
                    address: getMeterInfo.customer.address,
                    name: getMeterInfo.customer.name,
                    minimumAmount: +getMeterInfo.customer.minimumAmount,
                    util: getMeterInfo.customer.util,
                },
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof IRechargeError: {
                    const clientErrorCodes = ["13", "14", "15", "41"];
                    if (clientErrorCodes.includes(error.status)) {
                        throw new IRechargeGetMeterInfoException(
                            error.message,
                            HttpStatus.BAD_REQUEST
                        );
                    }

                    throw new IRechargeGetMeterInfoException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
                case error instanceof IRechargePowerException: {
                    throw error;
                }

                default: {
                    throw new IRechargePowerException(
                        "Failed to retrieve meter information. Error ocurred",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    async vendPower(options: VendPowerOptions): Promise<VendPowerResponse> {
        try {
            const vendPowerHash = this.iRecharge.vendPowerHash({
                accessToken: options.accessToken,
                amount: options.amount,
                disco: options.discoCode,
                meterNumber: options.meterNumber,
                referenceId: options.referenceId,
            });

            const vendPowerResp = await this.iRecharge.vendPower({
                access_token: options.accessToken,
                amount: options.amount,
                disco: options.discoCode,
                email: options.email,
                meter: options.meterNumber,
                hash: vendPowerHash,
                phone: options.accountId,
                reference_id: options.referenceId,
            });
            return {
                meterToken: vendPowerResp.meter_token,
                units: vendPowerResp.units,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof IRechargeError: {
                    const clientErrorCodes = ["13", "14", "15", "41"];
                    if (clientErrorCodes.includes(error.status)) {
                        throw new IRechargeVendPowerException(
                            error.message,
                            HttpStatus.BAD_REQUEST
                        );
                    }

                    throw new IRechargeVendPowerException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new IRechargePowerException(
                        "Failed to vend power. Error ocurred",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    async getDataBundles(
        networkProvider: NetworkDataProvider
    ): Promise<GetDataBundleResponse[]> {
        try {
            const fetchData = async (networkProvider: DataBundleProvider) => {
                const resp = await this.iRecharge.getDataBundles({
                    data_network: networkProvider,
                });

                if (!resp || !resp.bundles) {
                    throw new IRechargeDataException(
                        "Unable to retrieve data bundles from upstream service",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                return resp.bundles.map((bundle) => {
                    return {
                        code: bundle.code,
                        price: +bundle.price,
                        title: bundle.title,
                        validity: bundle.validity,
                        billProvider: this.provider,
                    };
                });
            };

            switch (networkProvider) {
                case NetworkDataProvider.AIRTEL: {
                    return await fetchData(DataBundleProvider.AIRTEL);
                }
                case NetworkDataProvider.MTN: {
                    return await fetchData(DataBundleProvider.MTN);
                }
                case NetworkDataProvider.GLO: {
                    return await fetchData(DataBundleProvider.GLO);
                }
                case NetworkDataProvider.SMILE: {
                    return await fetchData(DataBundleProvider.SMILE);
                }
                case NetworkDataProvider.ETISALAT: {
                    return await fetchData(DataBundleProvider.ETISALAT);
                }
                case NetworkDataProvider.SPECTRANET: {
                    return await fetchData(DataBundleProvider.SPECTRANET);
                }

                default: {
                    throw new IRechargeDataException(
                        "Invalid data bundle provider network",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        } catch (error) {
            switch (true) {
                case error instanceof IRechargeError: {
                    throw new IRechargeDataException(
                        "Unable to retrieve data bundles from upstream service",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                case error instanceof IRechargeDataException: {
                    throw error;
                }

                default: {
                    throw new IRechargeDataException(
                        "Failed to retrieve data bundles",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    async vendData(options: VendDataOptions): Promise<VendDataResponse> {
        try {
            const vendDataHash = this.iRecharge.vendDataHash({
                referenceId: options.referenceId,
                vtuData: options.dataCode,
                vtuNetwork: this.resolveNetworkName(options.vtuNetwork),
                vtuNumber: options.vtuNumber,
            });

            const response = await this.iRecharge.vendData({
                hash: vendDataHash,
                reference_id: options.referenceId,
                vtu_data: options.dataCode,
                vtu_network: this.resolveNetworkName(options.vtuNetwork),
                vtu_number: options.vtuNumber,
                vtu_email: options.vtuEmail,
            });
            return {
                networkProviderReference: response.ref,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof IRechargeError: {
                    const clientErrorCodes = ["41"];
                    if (clientErrorCodes.includes(error.status)) {
                        throw new IRechargeVendDataException(
                            error.message,
                            HttpStatus.BAD_REQUEST
                        );
                    }

                    throw new IRechargeVendDataException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new IRechargeDataException(
                        "Failed to vend data. Error ocurred",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    resolveNetworkName(network: NetworkDataProvider) {
        switch (network) {
            case NetworkDataProvider.AIRTEL: {
                return DataBundleProvider.AIRTEL;
            }
            case NetworkDataProvider.MTN: {
                return DataBundleProvider.MTN;
            }
            case NetworkDataProvider.GLO: {
                return DataBundleProvider.GLO;
            }
            case NetworkDataProvider.ETISALAT: {
                return DataBundleProvider.ETISALAT;
            }
            case NetworkDataProvider.SMILE: {
                return DataBundleProvider.SMILE;
            }
            case NetworkDataProvider.SPECTRANET: {
                return DataBundleProvider.SPECTRANET;
            }

            default:
                break;
        }
    }
}
