import {
    DiscoBundleData,
    IRecharge,
    TVNetworkProvider,
} from "@/libs/iRecharge";
import { IRechargeError } from "@/libs/iRecharge/errors";
import { AirtimeProvider } from "@/libs/iRecharge/interfaces/airtime";
import { DataBundleProvider } from "@/libs/iRecharge/interfaces/data";
import { HttpStatus, Injectable } from "@nestjs/common";
import logger from "moment-logger";
import { UnprocessedTransactionException } from "../../../errors";
import {
    NetworkDataProvider,
    GetDataBundleResponse,
    GetMeterInfoOptions,
    GetMeterResponse,
    MeterType,
    VendPowerOptions,
    VendPowerResponse,
    VendDataOptions,
    VendDataResponse,
    VendAirtimeOptions,
    VendAirtimeResponse,
    FormattedElectricDiscoData,
    NetworkAirtimeProvider,
    CableTVProvider,
    NetworkInternetProvider,
    GetInternetBundleResponse,
    VendInternetOptions,
    VendInternetResponse,
    getSmileDeviceInfoOptions,
    GetSmartCardInfoOptions,
    GetSmartCardInfoResponse,
    VendTVOptions,
    VendCableTVResponse,
    BillPaymentWorkflow,
} from "../../../interfaces";
import {
    IRechargeAirtimeException,
    IRechargeCableTVException,
    IRechargeDataException,
    IRechargeInternetException,
    IRechargePowerException,
    IRechargeVendAirtimeException,
    IRechargeVendCableTVException,
    IRechargeVendDataException,
    IRechargeVendInternetException,
    IRechargeVendPowerException,
    IRechargeWalletException,
} from "../errors";

@Injectable()
export class IRechargeWorkflowService implements BillPaymentWorkflow {
    public provider = "irecharge";
    constructor(private iRecharge: IRecharge) {}

    private blackListedDiscos: string[] = [
        "Ikeja_Electric_Bill_Payment",
        "Ikeja_Token_Purchase",
    ];

    private unprocessedTransactionCodes: string[] = [
        "04",
        "11",
        "42",
        "43",
        "44",
        "51",
    ];

    private handleUnprocessedTransactionError(error: IRechargeError) {
        if (this.unprocessedTransactionCodes.includes(error.status)) {
            throw new UnprocessedTransactionException(
                error.message ?? "irecharge unprocessed transaction",
                HttpStatus.NOT_IMPLEMENTED
            );
        }
    }

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
                throw new IRechargePowerException(
                    "Failed to retrieve meter information",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return {
                accessToken: getMeterInfo.access_token,
                meter: {
                    minimumAmount: +getMeterInfo.customer.minimumAmount,
                    maximumAmount: null,
                    meterAccountType: null,
                },
                customer: {
                    address: getMeterInfo.customer.address,
                    name: getMeterInfo.customer.name,
                },
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof IRechargeError: {
                    this.handleUnprocessedTransactionError(error);
                    throw new IRechargePowerException(
                        error.message,
                        HttpStatus.BAD_REQUEST
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
                receiptNO: vendPowerResp.ref,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof IRechargeError: {
                    this.handleUnprocessedTransactionError(error);
                    throw new IRechargeVendPowerException(
                        error.message,
                        HttpStatus.BAD_REQUEST
                    );
                }

                default: {
                    throw new IRechargeVendPowerException(
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

                case NetworkDataProvider.ETISALAT: {
                    return await fetchData(DataBundleProvider.ETISALAT);
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
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                case error instanceof IRechargeDataException: {
                    throw error;
                }

                default: {
                    throw new IRechargeDataException(
                        error.message,
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
                vtuNetwork: this.resolveDataNetworkName(options.vtuNetwork),
                vtuNumber: options.vtuNumber,
            });

            const response = await this.iRecharge.vendData({
                hash: vendDataHash,
                reference_id: options.referenceId,
                vtu_data: options.dataCode,
                vtu_network: this.resolveDataNetworkName(options.vtuNetwork),
                vtu_number: options.vtuNumber,
                vtu_email: options.vtuEmail,
            });
            return {
                networkProviderReference: response.ref,
                receiptNO: response.ref,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof IRechargeError: {
                    this.handleUnprocessedTransactionError(error);
                    throw new IRechargeVendDataException(
                        error.message,
                        HttpStatus.BAD_REQUEST
                    );
                }

                default: {
                    throw new IRechargeVendDataException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    private resolveDataNetworkName(network: NetworkDataProvider) {
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

            default:
                throw new IRechargeDataException(
                    "Unable to resolve data network provider name for iRecharge. Invalid name or not supported",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
        }
    }

    private resolveAirtimeNetworkName(network: NetworkAirtimeProvider) {
        switch (network) {
            case NetworkAirtimeProvider.AIRTEL: {
                return AirtimeProvider.AIRTEL;
            }
            case NetworkAirtimeProvider.MTN: {
                return AirtimeProvider.MTN;
            }
            case NetworkAirtimeProvider.GLO: {
                return AirtimeProvider.GLO;
            }
            case NetworkAirtimeProvider.ETISALAT: {
                return AirtimeProvider.ETISALAT;
            }

            default: {
                throw new IRechargeAirtimeException(
                    "Unable to resolve airtime network provider name for iRecharge. Invalid name or not supported",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        }
    }

    async vendAirtime(
        options: VendAirtimeOptions
    ): Promise<VendAirtimeResponse> {
        try {
            const vendAirtimeHash = this.iRecharge.vendAirtimeHash({
                referenceId: options.referenceId,
                vtuAmount: options.vtuAmount,
                vtuNetwork: this.resolveAirtimeNetworkName(options.vtuNetwork),
                vtuNumber: options.vtuNumber,
            });
            const resp = await this.iRecharge.vendAirtime({
                hash: vendAirtimeHash,
                reference_id: options.referenceId,
                vtu_amount: options.vtuAmount,
                vtu_email: options.vtuEmail,
                vtu_network: this.resolveAirtimeNetworkName(options.vtuNetwork),
                vtu_number: options.vtuNumber,
            });

            return {
                networkProviderReference: resp.ref,
                amount: resp.amount,
                phone: resp.receiver,
                receiptNO: resp.ref,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof IRechargeError: {
                    this.handleUnprocessedTransactionError(error);
                    throw new IRechargeVendAirtimeException(
                        error.message,
                        HttpStatus.BAD_REQUEST
                    );
                }

                default: {
                    throw new IRechargeVendAirtimeException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    async getInternetBundles(
        networkProvider: NetworkInternetProvider
    ): Promise<GetInternetBundleResponse[]> {
        try {
            const fetchData = async (networkProvider: DataBundleProvider) => {
                const resp = await this.iRecharge.getDataBundles({
                    data_network: networkProvider,
                });

                if (!resp || !resp.bundles) {
                    throw new IRechargeInternetException(
                        "Unable to retrieve internet bundles from upstream service",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                return resp.bundles.map((bundle) => {
                    return {
                        code: bundle.code,
                        price: +bundle.price,
                        title: bundle.title,
                    };
                });
            };

            switch (networkProvider) {
                case NetworkInternetProvider.AIRTEL: {
                    return await fetchData(DataBundleProvider.AIRTEL);
                }
                case NetworkInternetProvider.MTN: {
                    return await fetchData(DataBundleProvider.MTN);
                }
                case NetworkInternetProvider.GLO: {
                    return await fetchData(DataBundleProvider.GLO);
                }

                case NetworkInternetProvider.ETISALAT: {
                    return await fetchData(DataBundleProvider.ETISALAT);
                }
                case NetworkInternetProvider.SMILE: {
                    return await fetchData(DataBundleProvider.SMILE);
                }

                case NetworkInternetProvider.SPECTRANET: {
                    return await fetchData(DataBundleProvider.SPECTRANET);
                }

                default: {
                    throw new IRechargeInternetException(
                        "Invalid internet bundle provider network",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        } catch (error) {
            switch (true) {
                case error instanceof IRechargeError: {
                    throw new IRechargeInternetException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                case error instanceof IRechargeInternetException: {
                    throw error;
                }

                default: {
                    throw new IRechargeInternetException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    async vendInternet(
        options: VendInternetOptions
    ): Promise<VendInternetResponse> {
        try {
            const vendInternetHash = this.iRecharge.vendDataHash({
                referenceId: options.referenceId,
                vtuData: options.internetCode,
                vtuNetwork: this.resolveInternetNetworkName(options.vtuNetwork),
                vtuNumber: options.vtuNumber,
            });

            const response = await this.iRecharge.vendData({
                hash: vendInternetHash,
                reference_id: options.referenceId,
                vtu_data: options.internetCode,
                vtu_network: this.resolveInternetNetworkName(
                    options.vtuNetwork
                ),
                vtu_number: options.vtuNumber,
                vtu_email: options.vtuEmail,
            });
            return {
                networkProviderReference: response.ref,
                amount: response.amount,
                receiver: response.receiver,
                receiptNO: response.ref,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof IRechargeError: {
                    this.handleUnprocessedTransactionError(error);
                    throw new IRechargeVendInternetException(
                        error.message,
                        HttpStatus.BAD_REQUEST
                    );
                }

                default: {
                    throw new IRechargeVendInternetException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    private resolveInternetNetworkName(network: NetworkInternetProvider) {
        switch (network) {
            case NetworkInternetProvider.AIRTEL: {
                return DataBundleProvider.AIRTEL;
            }
            case NetworkInternetProvider.MTN: {
                return DataBundleProvider.MTN;
            }
            case NetworkInternetProvider.GLO: {
                return DataBundleProvider.GLO;
            }
            case NetworkInternetProvider.ETISALAT: {
                return DataBundleProvider.ETISALAT;
            }
            case NetworkInternetProvider.SMILE: {
                return DataBundleProvider.SMILE;
            }
            case NetworkInternetProvider.SPECTRANET: {
                return DataBundleProvider.SPECTRANET;
            }

            default: {
                throw new IRechargeInternetException(
                    "Unable to resolve internet network provider name for iRecharge provider. Invalid network name or not supported",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        }
    }

    async getSmileDeviceInfo(options: getSmileDeviceInfoOptions) {
        try {
            const hash = this.iRecharge.getSmileDeviceInfoHash({
                receiver: options.deviceId,
            });

            const resp = await this.iRecharge.getSmileDeviceInfo({
                hash: hash,
                receiver: options.deviceId,
            });
            return resp;
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof IRechargeError: {
                    this.handleUnprocessedTransactionError(error);
                    throw new IRechargeDataException(
                        error.message,
                        HttpStatus.BAD_REQUEST
                    );
                }

                default: {
                    throw new IRechargeDataException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    async getCableTVBouquets(
        cableTVProvider: CableTVProvider
    ): Promise<GetDataBundleResponse[]> {
        try {
            const fetchData = async (cableTVProvider: TVNetworkProvider) => {
                const resp = await this.iRecharge.getTVBouquet({
                    tv_network: cableTVProvider,
                });

                if (!resp || !resp.bundles) {
                    throw new IRechargeCableTVException(
                        "Unable to retrieve TV bundles from upstream service",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                let bouquets = resp.bundles.map((bundle) => {
                    return {
                        code: bundle.code,
                        price: +bundle.price,
                        title: bundle.title,
                    };
                });
                if (cableTVProvider == TVNetworkProvider.STARTIMES) {
                    bouquets = bouquets.slice(1); //first element not a valid plan
                }
                return bouquets;
            };

            switch (cableTVProvider) {
                case CableTVProvider.DSTV: {
                    return await fetchData(TVNetworkProvider.DSTV);
                }
                case CableTVProvider.GOTV: {
                    return await fetchData(TVNetworkProvider.GOTV);
                }
                case CableTVProvider.STARTIMES: {
                    return await fetchData(TVNetworkProvider.STARTIMES);
                }

                default: {
                    throw new IRechargeCableTVException(
                        "Invalid TV bundle provider network",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        } catch (error) {
            switch (true) {
                case error instanceof IRechargeError: {
                    throw new IRechargeCableTVException(
                        "Unable to retrieve TV bundles from upstream service",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                case error instanceof IRechargeCableTVException: {
                    throw error;
                }

                default: {
                    throw new IRechargeCableTVException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    async getSmartCardInfo(
        options: GetSmartCardInfoOptions
    ): Promise<GetSmartCardInfoResponse> {
        try {
            const serviceCode =
                options.tvNetwork == CableTVProvider.STARTIMES
                    ? "StarTimes"
                    : options.tvCode;

            const hash = this.iRecharge.getSmartCardInfoHash({
                referenceId: options.reference,
                serviceCode: serviceCode,
                smartCardNumber: options.smartCardNumber,
                tvNetwork: this.resolveTVNetworkName(options.tvNetwork),
            });

            const resp = await this.iRecharge.getSmartCardInfo({
                hash: hash,
                reference_id: options.reference,
                service_code: serviceCode,
                smartcard_number: options.smartCardNumber,
                tv_network: this.resolveTVNetworkName(options.tvNetwork),
            });
            if (!resp) {
                throw new IRechargeCableTVException(
                    "Unable to retrieve SmartCard Information",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
            return {
                accessToken: resp.access_token,
                customer: {
                    address: resp.customer,
                    name: resp.customer_number,
                },
            };
        } catch (error) {
            switch (true) {
                case error instanceof IRechargeCableTVException: {
                    throw error;
                }
                case error instanceof IRechargeError: {
                    this.handleUnprocessedTransactionError(error);
                    throw new IRechargeCableTVException(
                        error.message,
                        HttpStatus.BAD_REQUEST
                    );
                }

                default: {
                    throw new IRechargeCableTVException(
                        "Failed to retrieve smart card information",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    private resolveTVNetworkName(network: CableTVProvider): TVNetworkProvider {
        switch (network) {
            case CableTVProvider.DSTV: {
                return TVNetworkProvider.DSTV;
            }
            case CableTVProvider.GOTV: {
                return TVNetworkProvider.GOTV;
            }
            case CableTVProvider.STARTIMES: {
                return TVNetworkProvider.STARTIMES;
            }

            default: {
                throw new IRechargeVendCableTVException(
                    "Failed to resolve iRecharge cable TV network name. Invalid TV network name or network not supported",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        }
    }

    async vendCableTV(options: VendTVOptions): Promise<VendCableTVResponse> {
        try {
            const serviceCode =
                options.tvNetwork == CableTVProvider.STARTIMES
                    ? "StarTimes"
                    : options.tvCode;

            const hash = this.iRecharge.vendTVHash({
                referenceId: options.referenceId,
                accessToken: options.accessToken,
                serviceCode: serviceCode,
                smartCardNumber: options.smartCardNumber,
                tvNetwork: this.resolveTVNetworkName(options.tvNetwork),
            });

            const response = await this.iRecharge.vendTV({
                hash: hash,
                access_token: options.accessToken,
                email: options.email,
                phone: options.phone,
                reference_id: options.referenceId,
                service_code: serviceCode,
                smartcard_number: options.smartCardNumber,
                tv_network: this.resolveTVNetworkName(options.tvNetwork),
            });
            return {
                vendRef: response.ref,
                receiptNO: response.ref,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof IRechargeError: {
                    this.handleUnprocessedTransactionError(error);
                    throw new IRechargeVendCableTVException(
                        error.message,
                        HttpStatus.BAD_REQUEST
                    );
                }

                default: {
                    throw new IRechargeVendCableTVException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    async getWalletBalance(): Promise<number> {
        try {
            const { wallet_balance } = await this.iRecharge.getWalletBalance();
            return +wallet_balance;
        } catch (error) {
            throw new IRechargeWalletException(
                error.message ?? "Failed to retrieve wallet balance",
                HttpStatus.SERVICE_UNAVAILABLE
            );
        }
    }
}
