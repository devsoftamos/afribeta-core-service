import Axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import {
    PaystackAuthorizationError,
    PaystackNotFoundError,
    PaystackServerError,
    PaystackValidationError,
} from "./errors";
import {
    AssignDynamicVirtualAccountWithValidationOptions,
    BankListOptions,
    BankListResponseData,
    PaystackOptions,
    PaystackResponse,
    ResolveBankAccountOptions,
    ResolveBankAccountResponse,
} from "./interfaces";
import {
    InitiateTransferOptions,
    InitiateTransferResponseData,
    TransferRecipientOptions,
    TransferRecipientResponseData,
} from "./interfaces/transfer";

export * from "./errors";
export * from "./interfaces";

export class Paystack {
    private axios: AxiosInstance = Axios.create({
        baseURL: this.instanceOptions.baseUrl,
        headers: {
            Authorization: `Bearer ${this.instanceOptions.secretKey}`,
            "Content-Type": "application/json",
        },
    });
    constructor(protected instanceOptions: PaystackOptions) {}

    private handlePaystackError(error: AxiosError<any>) {
        switch (true) {
            case error.response?.status == 401: {
                throw new PaystackAuthorizationError(
                    error.response.data.message
                );
            }
            case error.response?.status == 400: {
                throw new PaystackValidationError(error.response.data.message);
            }

            case error.response?.status == 404: {
                throw new PaystackNotFoundError(error.response.data.message);
            }

            default: {
                throw new PaystackServerError("Something unexpected happened");
            }
        }
    }

    /**
     * Note: This method triggers two webhooks events due to the customer validation step.
     * If the customer validation step fails, customeridentification.failed and assigndedicatedaccount.failed events would be sent.
     * If all goes well, customeridentification.success and the assigndedicatedaccount.success events would be fired.
     *
     * Read more in the [docs](https://paystack.com/docs/payments/dedicated-virtual-accounts).
     * @param options
     *
     * @description This method creates, validates and assigns dynamic virtual account to a customer
     */
    async assignDynamicValidatedVirtualAccount(
        options: AssignDynamicVirtualAccountWithValidationOptions
    ) {
        try {
            const requestOptions: AxiosRequestConfig<AssignDynamicVirtualAccountWithValidationOptions> =
                {
                    url: "/dedicated_account/assign",
                    method: "POST",
                    data: {
                        email: options.email,
                        first_name: options.first_name,
                        last_name: options.last_name,
                        phone: options.phone,
                        account_number: options.account_number,
                        bank_code: options.bank_code,
                        bvn: options.bvn,
                        country: options.country,
                        preferred_bank: options.preferred_bank,
                        middle_name: options.middle_name,
                    },
                };
            const { data } = await this.axios<PaystackResponse>(requestOptions);
            return data;
        } catch (error) {
            if (!Axios.isAxiosError(error)) {
                throw error;
            }
            this.handlePaystackError(error);
        }
    }

    /**
     *
     * @param options query options
     * @returns list of banks
     * @description Get a list of all supported banks and their properties
     */
    async getBanks(options?: BankListOptions) {
        try {
            const requestOptions: AxiosRequestConfig = {
                method: "GET",
                url: "/bank",
                params: options,
            };
            const { data } = await this.axios<
                PaystackResponse<BankListResponseData[]>
            >(requestOptions);
            return data;
        } catch (error) {
            if (!Axios.isAxiosError(error)) {
                throw error;
            }
            this.handlePaystackError(error);
        }
    }

    /**
     *
     * @param options query options
     * @returns Bank account details
     * @description Resolve a bank account number by retrieving the name of the account
     */
    async resolveBankAccount(options: ResolveBankAccountOptions) {
        try {
            const requestOptions: AxiosRequestConfig = {
                method: "GET",
                url: "/bank/resolve",
                params: options,
            };
            const { data } = await this.axios<
                PaystackResponse<ResolveBankAccountResponse>
            >(requestOptions);
            return data;
        } catch (error) {
            if (!Axios.isAxiosError(error)) {
                throw error;
            }
            this.handlePaystackError(error);
        }
    }

    /**
     *
     * @param options request body options
     * @returns Created Recipient details
     * @description Creates a transfer recipient data
     *  Read more in the [docs](https://paystack.com/docs/transfers/single-transfers).
     */
    async createTransferRecipient(options: TransferRecipientOptions) {
        try {
            const requestOptions: AxiosRequestConfig<TransferRecipientOptions> =
                {
                    method: "POST",
                    url: "/transferrecipient",
                    data: options,
                };
            const { data } = await this.axios<
                PaystackResponse<TransferRecipientResponseData>
            >(requestOptions);
            return data;
        } catch (error) {
            if (!Axios.isAxiosError(error)) {
                throw error;
            }
            this.handlePaystackError(error);
        }
    }

    /**
     *
     * @param options request body options
     * @returns Paystack Response data
     * @description Initiates a transfer request
     *  Read more in the [docs](https://paystack.com/docs/api/transfer/#initiate).
     */

    async initiateTransfer(options: InitiateTransferOptions) {
        try {
            const requestOptions: AxiosRequestConfig<InitiateTransferOptions> =
                {
                    method: "POST",
                    url: "/transfer",
                    data: options,
                };
            const { data } = await this.axios<
                PaystackResponse<InitiateTransferResponseData>
            >(requestOptions);
            return data;
        } catch (error) {
            if (!Axios.isAxiosError(error)) {
                throw error;
            }
            this.handlePaystackError(error);
        }
    }
}
