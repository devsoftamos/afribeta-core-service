import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { IRechargeError } from "./errors";
import {
    GetElectricDiscosResponse,
    GetMeterInfoOptions,
    GetMeterInfoResponse,
    IRechargeOptions,
    RequestOptions,
    VendPowerOptions,
} from "./interfaces";
export * from "./interfaces";

export class IRecharge {
    private axios: AxiosInstance = Axios.create({
        baseURL: this.instanceOptions.baseUrl,
    });
    constructor(protected instanceOptions: IRechargeOptions) {}

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
}
