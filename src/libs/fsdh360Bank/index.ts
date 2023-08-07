import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import {
    FSDH360BankAuthenticationError,
    FSDH360BankError,
    FSDH360BankStaticVirtualAccountError,
} from "./errors";
import {
    FSDH360BankOptions,
    GetTokenOptions,
    GetTokenResponse,
} from "./interfaces";
import {
    CreateStaticVirtualAccountOptions,
    CreateStaticVirtualAccountResponse,
} from "./interfaces/virtualAccount";
export * from "./errors";
export * from "./interfaces";

export class FSDH360Bank {
    constructor(protected instanceOptions: FSDH360BankOptions) {}

    private axios: AxiosInstance = Axios.create({
        baseURL: this.instanceOptions.baseUrl,
        headers: {
            Authorization: `Bearer ${data.access_token}`,
        },
    });

    private authToken: string;

    private async authenticate() {
        try {
            const requestOptions: AxiosRequestConfig<GetTokenOptions> = {
                baseURL: this.instanceOptions.tokenUrl,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                method: "POST",
                data: {
                    client_id: this.instanceOptions.clientId,
                    client_secret: this.instanceOptions.clientSecret,
                    grant_type: "client_credentials",
                },
            };
            const { data } = await Axios<GetTokenResponse>(requestOptions);
            // const axios: AxiosInstance = Axios.create({
            //     baseURL: this.instanceOptions.baseUrl,
            //     headers: {
            //         Authorization: `Bearer ${data.access_token}`,
            //     },
            // });
            this.authToken = data.access_token;
            return data.access_token;
        } catch (error) {
            if (!Axios.isAxiosError(error)) {
                throw error;
            }
            const err = new FSDH360BankAuthenticationError(
                "FSDH360 authentication failed"
            );
            err.status = error.response.status;
            throw err;
        }
    }

    getHeader() {
        if (!this.authToken) {
            const error = new FSDH360BankError("Authentication token missing");
            error.status = 500;
        }
        return {
            Authorization: `Bearer ${this.authToken}`,
        };
    }

    async createStaticVirtualAccount(
        options: Omit<
            CreateStaticVirtualAccountOptions,
            "collectionAccountNumber" | "currencyCode"
        >
    ) {
        try {
            await this.authenticate();
            const requestOptions: AxiosRequestConfig<CreateStaticVirtualAccountOptions> =
                {
                    headers: this.getHeader(),
                    method: "POST",
                    url: "/virtualaccounts/static",
                    data: {
                        accountName: options.accountName,
                        bvn: options.bvn,
                        collectionAccountNumber:
                            this.instanceOptions.merchantAccountNumber,
                        currencyCode: "NGN",
                    },
                };
            const { data } =
                await this.axios<CreateStaticVirtualAccountResponse>(
                    requestOptions
                );
            return data;
        } catch (error) {
            if (!Axios.isAxiosError(error)) {
                throw error;
            }
            const err = new FSDH360BankStaticVirtualAccountError(
                error.response.data?.detail ??
                    "Failed to create static virtual account"
            );
            err.status = error.response.status;
            throw err;
        }
    }
}
