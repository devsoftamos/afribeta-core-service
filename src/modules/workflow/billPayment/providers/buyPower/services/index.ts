import { BuyPower, IBuyPower } from "@/libs/buyPower";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    BillPaymentWorkflow,
    CableTVProvider,
    GetDataBundleResponse,
    GetInternetBundleResponse,
    GetMeterInfoOptions,
    GetMeterResponse,
    NetworkAirtimeProvider,
    NetworkDataProvider,
    NetworkInternetProvider,
    VendAirtimeOptions,
    VendAirtimeResponse,
    VendDataOptions,
    VendDataResponse,
    VendInternetOptions,
    VendInternetResponse,
    VendPowerOptions,
    VendPowerResponse,
    VendTVOptions,
    VendTVResponse,
} from "../../../interfaces";
import {
    BuyPowerCableTVException,
    BuyPowerDataException,
    BuyPowerInternetException,
    BuyPowerPowerException,
    BuyPowerVendAirtimeException,
    BuyPowerVendCableTVException,
    BuyPowerVendDataException,
    BuyPowerVendInProgressError,
    BuyPowerVendInternetException,
    BuyPowerVendPowerException,
} from "../errors";
import logger from "moment-logger";
import { BuyPowerError } from "@/libs/buyPower/errors";
import { UnprocessedTransactionException } from "../../../errors";

@Injectable()
export class BuyPowerWorkflowService implements BillPaymentWorkflow {
    private buyPowerServerFailureCodes: number[] = [500, 501, 503, 422];
    private defaultServerErrorCodes: number[] = [500, 501, 503];

    constructor(private buyPower: BuyPower) {}

    private handleUnprocessedTransactionError(error: BuyPowerError) {
        if (this.buyPowerServerFailureCodes.includes(error.status)) {
            throw new UnprocessedTransactionException(
                error.message ?? "buypower unprocessed transaction",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private handlePendingTransactionError(error: BuyPowerError) {
        switch (error.status) {
            case 202: {
                throw new BuyPowerVendInProgressError(
                    "Vending in progress",
                    HttpStatus.ACCEPTED
                );
            }
            case 502: {
                throw new BuyPowerVendInProgressError(
                    "Vending in progress",
                    HttpStatus.BAD_GATEWAY
                );
            }

            default:
                break;
        }
    }

    async getMeterInfo(
        options: GetMeterInfoOptions
    ): Promise<GetMeterResponse> {
        try {
            const resp = await this.buyPower.getMeterInfo({
                disco: options.discoCode as IBuyPower.Power.Disco,
                meter: options.meterNumber,
                vendType: options.meterType,
            });

            if (!resp || !resp.data) {
                throw new BuyPowerPowerException(
                    "Failed to retrieve meter information",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return {
                customer: {
                    address: resp.data.address,
                    name: resp.data.name,
                    minimumAmount: resp.data.minVendAmount,
                    maximumAmount: resp.data.maxVendAmount,
                },
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof BuyPowerPowerException: {
                    throw error;
                }
                case error instanceof BuyPowerError: {
                    if (this.defaultServerErrorCodes.includes(error.status)) {
                        throw new BuyPowerPowerException(
                            "Failed to retrieve meter information from upstream server. Please try again",
                            HttpStatus.SERVICE_UNAVAILABLE
                        );
                    }

                    throw new BuyPowerPowerException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new BuyPowerPowerException(
                        "Failed to retrieve meter information. Error ocurred",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    async vendPower(options: VendPowerOptions): Promise<VendPowerResponse> {
        try {
            const resp = await this.buyPower.vendPower({
                amount: options.amount,
                disco: options.discoCode as IBuyPower.Power.Disco,
                email: options.email,
                meter: options.meterNumber,
                phone: options.accountId,
                orderId: options.referenceId,
                vendType: options.meterType,
            });

            if (!resp || !resp.data) {
                throw new BuyPowerVendPowerException(
                    "Unable to vend power. No response from upstream provider",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return {
                meterToken: resp.data.token,
                units: resp.data.units,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof BuyPowerVendPowerException: {
                    throw error;
                }

                case error instanceof BuyPowerError: {
                    this.handleUnprocessedTransactionError(error);
                    this.handlePendingTransactionError(error);
                    throw new BuyPowerVendPowerException(
                        error.message,
                        error.status
                    );
                }

                default: {
                    throw new BuyPowerVendPowerException(
                        "Failed to vend power. Error ocurred",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    //Airtime
    resolveAirtimeNetworkName(network: NetworkAirtimeProvider) {
        switch (network) {
            case NetworkAirtimeProvider.AIRTEL: {
                return IBuyPower.Airtime.VtuNetwork.AIRTEL;
            }
            case NetworkAirtimeProvider.MTN: {
                return IBuyPower.Airtime.VtuNetwork.MTN;
            }
            case NetworkAirtimeProvider.GLO: {
                return IBuyPower.Airtime.VtuNetwork.GLO;
            }
            case NetworkAirtimeProvider.ETISALAT: {
                return IBuyPower.Airtime.VtuNetwork["9MOBILE"];
            }

            default: {
                throw new BuyPowerVendAirtimeException(
                    "Unable to resolve airtime network provider name for buypower. The selected name is invalid or not supported",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        }
    }

    async vendAirtime(
        options: VendAirtimeOptions
    ): Promise<VendAirtimeResponse> {
        try {
            const resp = await this.buyPower.vendAirtime({
                vtuNetwork: this.resolveAirtimeNetworkName(options.vtuNetwork),
                amount: options.vtuAmount,
                orderId: options.referenceId,
                vtuNumber: options.vtuNumber,
                phone: options.vtuNumber,
            });

            if (!resp || !resp.data) {
                throw new BuyPowerVendAirtimeException(
                    "Unable to vend airtime. No response from upstream provider",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return {
                networkProviderReference: resp.data.vendRef.toString(),
                amount: resp.data.totalAmountPaid,
                phone: options.vtuNumber,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof BuyPowerVendAirtimeException: {
                    throw error;
                }
                case error instanceof BuyPowerError: {
                    this.handleUnprocessedTransactionError(error);
                    this.handlePendingTransactionError(error);
                    throw new BuyPowerVendAirtimeException(
                        error.message,
                        error.status
                    );
                }

                default: {
                    throw new BuyPowerVendAirtimeException(
                        "Failed to vend airtime. Error ocurred",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    //data
    private resolveDataNetworkName(network: NetworkDataProvider) {
        switch (network) {
            case NetworkDataProvider.AIRTEL: {
                return IBuyPower.Data.DataNetwork.AIRTEL;
            }
            case NetworkDataProvider.MTN: {
                return IBuyPower.Data.DataNetwork.MTN;
            }
            case NetworkDataProvider.GLO: {
                return IBuyPower.Data.DataNetwork.GLO;
            }
            case NetworkDataProvider.ETISALAT: {
                return IBuyPower.Data.DataNetwork["9MOBILE"];
            }

            default:
                throw new BuyPowerVendDataException(
                    "Unable to resolve data network provider name for buypower. Invalid name or not supported",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
        }
    }

    async vendData(options: VendDataOptions): Promise<VendDataResponse> {
        try {
            const resp = await this.buyPower.vendData({
                amount: options.amount,
                orderId: options.referenceId,
                phone: options.vtuNumber,
                vtuNumber: options.vtuNumber,
                tariffClass: options.dataCode,
                network: this.resolveDataNetworkName(options.vtuNetwork),
            });

            if (!resp || !resp.data) {
                throw new BuyPowerVendDataException(
                    "Unable to vend data. No response from upstream provider",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return {
                networkProviderReference: resp.data.vendRef.toString(),
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof BuyPowerVendDataException: {
                    throw error;
                }
                case error instanceof BuyPowerError: {
                    this.handleUnprocessedTransactionError(error);
                    this.handlePendingTransactionError(error);
                    throw new BuyPowerVendDataException(
                        error.message,
                        error.status
                    );
                }

                default: {
                    throw new BuyPowerVendDataException(
                        "Failed to vend data. Error ocurred",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    //internet
    private resolveInternetNetworkName(network: NetworkInternetProvider) {
        switch (network) {
            case NetworkInternetProvider.AIRTEL: {
                return IBuyPower.Data.DataNetwork.AIRTEL;
            }
            case NetworkInternetProvider.MTN: {
                return IBuyPower.Data.DataNetwork.MTN;
            }
            case NetworkInternetProvider.GLO: {
                return IBuyPower.Data.DataNetwork.GLO;
            }
            case NetworkInternetProvider.ETISALAT: {
                return IBuyPower.Data.DataNetwork["9MOBILE"];
            }

            default: {
                throw new BuyPowerVendInternetException(
                    "Unable to resolve internet network provider name for buypower provider. Invalid network name or not supported",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        }
    }

    async vendInternet(
        options: VendInternetOptions
    ): Promise<VendInternetResponse> {
        try {
            const resp = await this.buyPower.vendData({
                amount: options.amount,
                orderId: options.referenceId,
                phone: options.vtuNumber,
                vtuNumber: options.vtuNumber,
                tariffClass: options.internetCode,
                network: this.resolveInternetNetworkName(options.vtuNetwork),
            });

            if (!resp || !resp.data) {
                throw new BuyPowerVendInternetException(
                    "Unable to vend internet. No response from upstream provider",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return {
                networkProviderReference: resp.data.vendRef.toString(),
                amount: resp.data.totalAmountPaid,
                receiver: options.vtuNumber,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof BuyPowerVendInternetException: {
                    throw error;
                }
                case error instanceof BuyPowerError: {
                    this.handleUnprocessedTransactionError(error);
                    this.handlePendingTransactionError(error);
                    throw new BuyPowerVendInternetException(
                        error.message,
                        error.status
                    );
                }

                default: {
                    throw new BuyPowerVendInternetException(
                        "Failed to vend internet. Error ocurred",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    //cable tv
    private resolveTVNetworkName(network: CableTVProvider) {
        switch (network) {
            case CableTVProvider.DSTV: {
                return IBuyPower.CableTv.CableTVNetwork.DSTV;
            }
            case CableTVProvider.GOTV: {
                return IBuyPower.CableTv.CableTVNetwork.GOTV;
            }
            case CableTVProvider.STARTIMES: {
                return IBuyPower.CableTv.CableTVNetwork.STARTIMES;
            }

            default: {
                throw new BuyPowerVendCableTVException(
                    "Failed to resolve cable TV network name. Invalid TV network name or network not supported",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        }
    }

    async vendTV(options: VendTVOptions): Promise<VendTVResponse> {
        try {
            const resp = await this.buyPower.vendTV({
                amount: options.amount,
                orderId: options.referenceId,
                phone: options.phone,
                smartCardNumber: options.smartCardNumber,
                tariffClass: options.tvCode,
                network: this.resolveTVNetworkName(options.tvNetwork),
            });

            if (!resp || !resp.data) {
                throw new BuyPowerVendCableTVException(
                    "Unable to vend cable TV. No response from upstream provider",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return {
                vendRef: resp.data.vendRef.toString(),
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof BuyPowerVendCableTVException: {
                    throw error;
                }
                case error instanceof BuyPowerError: {
                    this.handleUnprocessedTransactionError(error);
                    this.handlePendingTransactionError(error);
                    throw new BuyPowerVendCableTVException(
                        error.message,
                        error.status
                    );
                }

                default: {
                    throw new BuyPowerVendCableTVException(
                        "Failed to vend cable tv. Error ocurred",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    //fetch tv bouquets
    async getCableTVBouquets(
        cableTVProvider: CableTVProvider
    ): Promise<GetDataBundleResponse[]> {
        try {
            const fetchData = async (
                cableTVProvider: IBuyPower.CableTv.CableTVNetwork
            ) => {
                const resp = await this.buyPower.getPriceList({
                    provider: cableTVProvider,
                    vertical: "TV",
                });

                if (!resp || !resp.data) {
                    throw new BuyPowerCableTVException(
                        "Unable to retrieve TV bouquets from upstream service",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                let bouquets = resp.data.map((bundle) => {
                    return {
                        code: bundle.code,
                        price: bundle.price,
                        title: bundle.desc,
                    };
                });

                return bouquets;
            };

            switch (cableTVProvider) {
                case CableTVProvider.DSTV: {
                    return await fetchData(
                        IBuyPower.CableTv.CableTVNetwork.DSTV
                    );
                }
                case CableTVProvider.GOTV: {
                    return await fetchData(
                        IBuyPower.CableTv.CableTVNetwork.GOTV
                    );
                }
                case CableTVProvider.STARTIMES: {
                    return await fetchData(
                        IBuyPower.CableTv.CableTVNetwork.STARTIMES
                    );
                }

                default: {
                    throw new BuyPowerCableTVException(
                        "Invalid TV bundle provider network",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof BuyPowerCableTVException: {
                    throw error;
                }
                case error instanceof BuyPowerError: {
                    if (this.defaultServerErrorCodes.includes(error.status)) {
                        throw new BuyPowerCableTVException(
                            "Failed to retrieve TV bouquets from upstream server. Please try again",
                            HttpStatus.SERVICE_UNAVAILABLE
                        );
                    }

                    throw new BuyPowerCableTVException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new BuyPowerCableTVException(
                        "Failed to retrieve TV bouquets from upstream server. Please try again",
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
            const fetchData = async (
                networkProvider: IBuyPower.Data.DataNetwork
            ) => {
                const resp = await this.buyPower.getPriceList({
                    provider: networkProvider,
                    vertical: "DATA",
                });

                return resp.data.map((bundle) => {
                    return {
                        code: bundle.code,
                        price: +bundle.price,
                        title: bundle.desc,
                    };
                });
            };

            switch (networkProvider) {
                case NetworkDataProvider.AIRTEL: {
                    return await fetchData(IBuyPower.Data.DataNetwork.AIRTEL);
                }
                case NetworkDataProvider.MTN: {
                    return await fetchData(IBuyPower.Data.DataNetwork.MTN);
                }
                case NetworkDataProvider.GLO: {
                    return await fetchData(IBuyPower.Data.DataNetwork.GLO);
                }

                case NetworkDataProvider.ETISALAT: {
                    return await fetchData(
                        IBuyPower.Data.DataNetwork["9MOBILE"]
                    );
                }

                default: {
                    throw new BuyPowerDataException(
                        "Invalid data bundle provider network",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof BuyPowerDataException: {
                    throw error;
                }
                case error instanceof BuyPowerError: {
                    if (this.defaultServerErrorCodes.includes(error.status)) {
                        throw new BuyPowerDataException(
                            "Failed to retrieve data bundles from upstream server. Please try again",
                            HttpStatus.SERVICE_UNAVAILABLE
                        );
                    }

                    throw new BuyPowerDataException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new BuyPowerDataException(
                        "Failed to retrieve data bundles. Error ocurred",
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
            const fetchData = async (
                networkProvider: IBuyPower.Data.DataNetwork
            ) => {
                const resp = await this.buyPower.getPriceList({
                    provider: networkProvider,
                    vertical: "DATA",
                });

                return resp.data.map((bundle) => {
                    return {
                        code: bundle.code,
                        price: +bundle.price,
                        title: bundle.desc,
                    };
                });
            };

            switch (networkProvider) {
                case NetworkInternetProvider.AIRTEL: {
                    return await fetchData(IBuyPower.Data.DataNetwork.AIRTEL);
                }
                case NetworkInternetProvider.MTN: {
                    return await fetchData(IBuyPower.Data.DataNetwork.MTN);
                }
                case NetworkInternetProvider.GLO: {
                    return await fetchData(IBuyPower.Data.DataNetwork.GLO);
                }

                case NetworkInternetProvider.ETISALAT: {
                    return await fetchData(
                        IBuyPower.Data.DataNetwork["9MOBILE"]
                    );
                }

                default: {
                    throw new BuyPowerDataException(
                        "Invalid data bundle provider network",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof BuyPowerInternetException: {
                    throw error;
                }
                case error instanceof BuyPowerError: {
                    if (this.defaultServerErrorCodes.includes(error.status)) {
                        throw new BuyPowerInternetException(
                            "Failed to retrieve internet bundles from upstream server. Please try again",
                            HttpStatus.SERVICE_UNAVAILABLE
                        );
                    }

                    throw new BuyPowerInternetException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new BuyPowerInternetException(
                        "Failed to retrieve internet bundles. Error ocurred",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }
}
