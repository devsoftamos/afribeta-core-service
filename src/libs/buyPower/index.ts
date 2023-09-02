import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { BuyPowerError } from "./errors";
import {
    BuyPowerOptions,
    BuyPowerResponse,
    GetPackagePriceListResponseData,
    GetPriceListOptions,
    Optional,
    ReQueryOptions,
    WalletBalanceResponseData,
} from "./interfaces";
import { Power, Airtime, Data, CableTv } from "./interfaces";
import * as rax from "retry-axios";
import { VendPowerOptions } from "./interfaces/power";
import { VendAirtimeOptions } from "./interfaces/airtime";
import { VendDataInputOptions, VendDataOptions } from "./interfaces/data";
import { VendTVInputOptions, VendTVOptions } from "./interfaces/tv";

export * as IBuyPower from "./interfaces";

export class BuyPower {
    private axios: AxiosInstance = Axios.create({
        baseURL: this.instanceOptions.baseUrl,
        headers: {
            Authorization: `Bearer ${this.instanceOptions.token}`,
        },
    });
    constructor(protected instanceOptions: BuyPowerOptions) {
        this.setAxiosRetry();
    }

    private setAxiosRetry() {
        rax.attach(this.axios);
    }

    private handleError(error: any) {
        if (!Axios.isAxiosError(error)) {
            throw error;
        }
        const err = new BuyPowerError(
            error.response?.data?.message ?? "Something wrong happened"
        );
        err.status = error.response?.status ?? 500;
        throw err;
    }

    //tv and data
    async getPriceList(options: GetPriceListOptions) {
        try {
            const requestOptions: AxiosRequestConfig = {
                url: "/tariff",
                method: "GET",
                params: {
                    provider: options.provider,
                    vertical: options.vertical,
                } as GetPriceListOptions,
            };
            const { data } = await this.axios<
                BuyPowerResponse<GetPackagePriceListResponseData>
            >(requestOptions);
            return data;
        } catch (error) {
            this.handleError(error);
        }
    }

    //power
    async getMeterInfo(
        options: Power.GetMeterInfoOptions
    ): Promise<BuyPowerResponse<Power.GetMeterInfoResponseData>> {
        try {
            const requestOptions: AxiosRequestConfig = {
                url: "/check/meter",
                method: "GET",
                params: {
                    disco: options.disco,
                    meter: options.meter,
                    orderId: options.orderId ?? false,
                    vendType: options.vendType,
                    vertical: "ELECTRICITY",
                } as Power.GetMeterInfoOptions,
            };
            const resp = await this.axios<Power.GetMeterInfoResponseData>(
                requestOptions
            );
            return {
                status: true,
                responseCode: resp.status,
                data: resp.data,
            };
        } catch (error) {
            this.handleError(error);
        }
    }

    private async reQuery<R>(options: ReQueryOptions): Promise<R> {
        const delayTime: number = options.delay ? options.delay[0] : 120;
        const requestOptions: AxiosRequestConfig = {
            url: `/transaction/${options.orderId}`,
            method: "GET",
            raxConfig: {
                retry: options.delay ? options.delay.length : 2,
                retryDelay: delayTime * 1000,
                statusCodesToRetry: [[202, 202]],
                backoffType: "static",
                instance: this.axios,
            },
        };

        const response = await this.axios(requestOptions);
        switch (response.status) {
            case 202: {
                const error = new BuyPowerError("Transaction in progress");
                error.status = 202;
                throw error;
            }
            case 200: {
                return response.data as R;
            }

            default: {
                const error = new BuyPowerError(
                    response.data?.message ?? "No response message"
                );
                error.status = response.status;
                throw error;
            }
        }
    }

    async vendPower(
        options: Optional<VendPowerOptions, "paymentType">
    ): Promise<BuyPowerResponse<Power.VendPowerResponseData>> {
        try {
            const requestOptions: AxiosRequestConfig<VendPowerOptions> = {
                url: "/vend",
                method: "POST",
                data: {
                    amount: options.amount,
                    disco: options.disco,
                    meter: options.meter,
                    orderId: options.orderId,
                    paymentType: options.paymentType ?? "ONLINE",
                    phone: options.phone,
                    vendType: options.vendType,
                    email: options.email,
                    name: options.name,
                    vertical: "ELECTRICITY",
                },
            };
            const response = await this.axios(requestOptions);

            if (response.status == 202) {
                const responseData = await this.reQuery<
                    BuyPowerResponse<Power.VendPowerResponseData>
                >({
                    orderId: options.orderId,
                    delay: response.data.data?.delay as any,
                });
                return responseData;
            }

            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async vendAirtime(
        options: Optional<VendAirtimeOptions, "paymentType">
    ): Promise<BuyPowerResponse<Airtime.VendAirtimeResponseData>> {
        try {
            const requestOptions: AxiosRequestConfig<VendAirtimeOptions> = {
                url: "/vend",
                method: "POST",
                data: {
                    amount: options.amount,
                    disco: options.disco,
                    meter: options.meter,
                    orderId: options.orderId,
                    paymentType: options.paymentType ?? "ONLINE",
                    phone: options.phone,
                    email: options.email,
                    name: options.name,
                    vertical: "VTU",
                },
            };
            const response = await this.axios(requestOptions);

            if (response.status == 202) {
                const responseData = await this.reQuery<
                    BuyPowerResponse<Airtime.VendAirtimeResponseData>
                >({
                    orderId: options.orderId,
                    delay: response.data.data?.delay as any,
                });
                return responseData;
            }

            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async vendData(
        options: VendDataInputOptions
    ): Promise<BuyPowerResponse<Data.VendDataResponseData>> {
        try {
            const requestOptions: AxiosRequestConfig<VendDataOptions> = {
                url: "/vend",
                method: "POST",
                data: {
                    amount: options.amount,
                    disco: options.network,
                    meter: options.vtuNumber,
                    orderId: options.orderId,
                    paymentType: options.paymentType ?? "ONLINE",
                    phone: options.phone,
                    email: options.email,
                    name: options.name,
                    vertical: "DATA",
                    tariffClass: options.tariffClass,
                },
            };
            const response = await this.axios(requestOptions);

            if (response.status == 202) {
                const responseData = await this.reQuery<
                    BuyPowerResponse<Data.VendDataResponseData>
                >({
                    orderId: options.orderId,
                    delay: response.data.data?.delay as any,
                });
                return responseData;
            }

            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async vendTV(
        options: VendTVInputOptions
    ): Promise<BuyPowerResponse<CableTv.VendTVResponseData>> {
        try {
            const requestOptions: AxiosRequestConfig<VendTVOptions> = {
                url: "/vend",
                method: "POST",
                data: {
                    amount: options.amount,
                    disco: options.network,
                    meter: options.smartCardNumber,
                    orderId: options.orderId,
                    paymentType: options.paymentType ?? "ONLINE",
                    phone: options.phone,
                    email: options.email,
                    name: options.name,
                    vertical: "TV",
                    tariffClass: options.tariffClass,
                },
            };
            const response = await this.axios(requestOptions);

            if (response.status == 202) {
                const responseData = await this.reQuery<
                    BuyPowerResponse<CableTv.VendTVResponseData>
                >({
                    orderId: options.orderId,
                    delay: response.data.data?.delay as any,
                });
                return responseData;
            }

            return response.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async walletBalance() {
        try {
            const requestOptions: AxiosRequestConfig = {
                url: "/wallet/balance",
                method: "GET",
            };

            const resp = await this.axios<
                BuyPowerResponse<WalletBalanceResponseData>
            >(requestOptions);

            return {
                status: true,
                responseCode: resp.status,
                data: resp.data,
            };
        } catch (error) {
            this.handleError(error);
        }
    }
}
