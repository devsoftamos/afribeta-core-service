import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import {
    FSDH360BankAuthenticationError,
    FSDH360BankError,
    FSDH360BankStaticVirtualAccountError,
    FSDH360BankVerifyBvnError,
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
import {
    BvnVerificationOptions,
    BvnVerificationResponse,
} from "./interfaces/verifyBvn";
export * from "./errors";
export * from "./interfaces";

export class FSDH360Bank {
    constructor(protected instanceOptions: FSDH360BankOptions) {}

    private axios: AxiosInstance = Axios.create({
        baseURL: this.instanceOptions.baseUrl,
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

    async verifyBvn(options: BvnVerificationOptions) {
        try {
            await this.authenticate();
            const requestOptions: AxiosRequestConfig<BvnVerificationOptions> = {
                headers: this.getHeader(),
                method: "POST",
                url: "/api/VerifySingleBVN",
                baseURL: this.instanceOptions.identityUrl,
                data: {
                    bvn: options.bvn,
                },
            };
            const { data } = await this.axios<BvnVerificationResponse>(
                requestOptions
            );
            return data;
        } catch (error) {
            if (!Axios.isAxiosError(error)) {
                throw error;
            }
            const err = new FSDH360BankVerifyBvnError(
                error.response.data?.detail ?? "Failed to verify BVN"
            );
            err.status = error.response.status;
            throw err;
        }
    }
}
