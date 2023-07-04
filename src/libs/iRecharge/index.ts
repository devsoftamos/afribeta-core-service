import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { IRechargeError } from "./errors";
import {
    GetElectricDiscosResponse,
    GetMeterInfoOptions,
    GetMeterInfoResponse,
    GetWalletBalanceResponse,
    IRechargeOptions,
    RequestOptions,
    VendPowerOptions,
    VendStatusOptions,
    VendStatusResponse,
} from "./interfaces";
import { VendAirtimeOptions, VendAirtimeResponse } from "./interfaces/airtime";
import {
    GetDataBundleOptions,
    GetDataBundleResponse,
    VendDataOptions,
    VendDataResponse,
} from "./interfaces/data";
import {
    GetSmartCardOptions,
    GetSmartCardResponse,
    GetTVBouquetOptions,
    GetTVBouquetResponse,
    VendTVOptions,
    VendTVResponse,
} from "./interfaces/tv";
export * from "./interfaces";

export class IRecharge {
    private axios: AxiosInstance = Axios.create({
        baseURL: this.instanceOptions.baseUrl,
    });
    constructor(protected instanceOptions: IRechargeOptions) {}

    //power
    async getMeterInfo(options: RequestOptions<GetMeterInfoOptions>) {
        try {
            const requestOptions: AxiosRequestConfig = {
                method: "GET",
                url: "get_meter_info.php",
                params: {
                    ...options,
                    vendor_code: this.instanceOptions.vendorCode,
                    response_format: "json",
                } as GetMeterInfoOptions,
            };
            const { data } = await this.axios<GetMeterInfoResponse>(
                requestOptions
            );
            if (data.status != "00") {
                const error = new IRechargeError(data.message);
                error.status = data.status;
                throw error;
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    async vendPower(options: RequestOptions<VendPowerOptions>) {
        try {
            const requestOptions: AxiosRequestConfig = {
                method: "GET",
                url: "vend_power.php",
                params: {
                    ...options,
                    response_format: "json",
                    vendor_code: this.instanceOptions.vendorCode,
                } as VendPowerOptions,
            };
            const { data } = await this.axios<GetMeterInfoResponse>(
                requestOptions
            );
            if (data.status != "00") {
                const error = new IRechargeError(data.message);
                error.status = data.status;
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    async getElectricDiscos() {
        try {
            const requestOptions: AxiosRequestConfig = {
                method: "GET",
                url: "get_electric_disco.php",
                params: {
                    response_format: "json",
                },
            };
            const { data } = await this.axios<GetElectricDiscosResponse>(
                requestOptions
            );
            if (data.status != "00") {
                const error = new IRechargeError(data.message);
                error.status = data.status;
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    //Data
    async getDataBundles(options: RequestOptions<GetDataBundleOptions>) {
        try {
            const requestOptions: AxiosRequestConfig = {
                method: "GET",
                url: "get_data_bundles.php",
                params: {
                    ...options,
                    response_format: "json",
                },
            };
            const { data } = await this.axios<GetDataBundleResponse>(
                requestOptions
            );
            if (data.status != "00") {
                const error = new IRechargeError(data.message);
                error.status = data.status;
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    async vendData(options: RequestOptions<VendDataOptions>) {
        try {
            const requestOptions: AxiosRequestConfig = {
                method: "GET",
                url: "vend_data.php",
                params: {
                    ...options,
                    response_format: "json",
                    vendor_code: this.instanceOptions.vendorCode,
                },
            };
            const { data } = await this.axios<VendDataResponse>(requestOptions);
            if (data.status != "00") {
                const error = new IRechargeError(data.message);
                error.status = data.status;
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    //TV
    async getTVBouquet(options: RequestOptions<GetTVBouquetOptions>) {
        try {
            const requestOptions: AxiosRequestConfig = {
                method: "GET",
                url: "get_tv_bouquet.php",
                params: {
                    ...options,
                    response_format: "json",
                },
            };
            const { data } = await this.axios<GetTVBouquetResponse>(
                requestOptions
            );
            if (data.status != "00") {
                const error = new IRechargeError(data.message);
                error.status = data.status;
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    async getSmartCardInfo(options: RequestOptions<GetSmartCardOptions>) {
        try {
            const requestOptions: AxiosRequestConfig = {
                method: "GET",
                url: "get_smartcard_info.php",
                params: {
                    ...options,
                    response_format: "json",
                    vendor_code: this.instanceOptions.vendorCode,
                },
            };
            const { data } = await this.axios<GetSmartCardResponse>(
                requestOptions
            );
            if (data.status != "00") {
                const error = new IRechargeError(data.message);
                error.status = data.status;
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    async vendTV(options: RequestOptions<VendTVOptions>) {
        try {
            const requestOptions: AxiosRequestConfig = {
                method: "GET",
                url: "vend_tv.php",
                params: {
                    ...options,
                    response_format: "json",
                    vendor_code: this.instanceOptions.vendorCode,
                },
            };
            const { data } = await this.axios<VendTVResponse>(requestOptions);
            if (data.status != "00") {
                const error = new IRechargeError(data.message);
                error.status = data.status;
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    //airtime
    async vendAirtime(options: RequestOptions<VendAirtimeOptions>) {
        try {
            const requestOptions: AxiosRequestConfig = {
                method: "GET",
                url: "vend_airtime.php",
                params: {
                    ...options,
                    response_format: "json",
                    vendor_code: this.instanceOptions.vendorCode,
                },
            };
            const { data } = await this.axios<VendAirtimeResponse>(
                requestOptions
            );
            if (data.status != "00") {
                const error = new IRechargeError(data.message);
                error.status = data.status;
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    //vend status
    async vendStatus(options: RequestOptions<VendStatusOptions>) {
        try {
            const requestOptions: AxiosRequestConfig = {
                method: "GET",
                url: "vend_status.php",
                params: {
                    ...options,
                    response_format: "json",
                    vendor_code: this.instanceOptions.vendorCode,
                },
            };
            const { data } = await this.axios<VendStatusResponse>(
                requestOptions
            );
            if (data.status != "00") {
                const error = new IRechargeError(data.vend_status);
                error.status = data.status;
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }

    async getWalletBalance() {
        try {
            const requestOptions: AxiosRequestConfig = {
                method: "GET",
                url: "get_wallet_balance.php",
                params: {
                    response_format: "json",
                    vendor_code: this.instanceOptions.vendorCode,
                },
            };
            const { data } = await this.axios<GetWalletBalanceResponse>(
                requestOptions
            );
            if (data.status != "00") {
                const error = new IRechargeError(
                    "Failed to retrieve wallet balance"
                );
                error.status = data.status;
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }
}
