import Axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { BuyPowerError } from "./errors";
import { BuyPowerOptions, BuyPowerResponse } from "./interfaces";
import { Power } from "./interfaces";
import * as rax from "retry-axios";

export * from "./interfaces";

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

    //power
    async getMeterInfo(options: Power.GetMeterInfoOptions) {
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
            const { data } = await this.axios<
                BuyPowerResponse<Power.GetMeterInfoResponseData>
            >(requestOptions);
            return data;
        } catch (error) {
            this.handleError(error);
        }
    }
}

// raxConfig: {
//   retry: 2,
//   retryDelay: 30 * 1000,
//   statusCodesToRetry: [[404, 404]],
//   backoffType: "static",
//   instance: axios,
//   onRetryAttempt(err) {
//     const cfg = rax.getConfig(err);
//     console.log(
//       `Retry attempts: ${cfg.currentRetryAttempt}, ${new Date()}`
//     );
//   },
// },
