import { ProvidusOptions, ProvidusResponse } from "./interfaces";
import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import {
    CreateReservedVirtualAccountOptions,
    CreateReservedVirtualAccountResponse,
} from "./interfaces/virtualAccount";
import { ProvidusError } from "./errors";
export * from "./interfaces";
export * from "./errors";

export class Providus {
    private axios: AxiosInstance = Axios.create({
        baseURL: this.instanceOptions.baseUrl,
        headers: {
            "X-Auth-Signature": this.instanceOptions.authSignature,
            "Content-Type": "application/json",
            "Client-Id": this.instanceOptions.clientId,
        },
    });
    constructor(protected instanceOptions: ProvidusOptions) {}

    async createReservedVirtualAccount(
        options: CreateReservedVirtualAccountOptions
    ) {
        try {
            const requestOptions: AxiosRequestConfig<CreateReservedVirtualAccountOptions> =
                {
                    url: "/PiPCreateReservedAccountNumber",
                    method: "POST",
                    data: {
                        account_name: options.account_name,
                        bvn: options.bvn,
                    },
                };
            const { data } = await this.axios<
                ProvidusResponse<CreateReservedVirtualAccountResponse>
            >(requestOptions);

            if (data.responseCode != "00") {
                const error = new ProvidusError(data.responseMessage);
                error.status = data.responseCode;
                throw error;
            }
            return data;
        } catch (error) {
            throw error;
        }
    }
}
