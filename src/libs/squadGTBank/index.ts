import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { SquadGtBankVirtualAccountError } from "./errors";
import { SquadGTBankOptions, SquadGTBankResponse } from "./interfaces";
import {
    CreateBusinessVirtualAccountOptions,
    CreateBusinessVirtualAccountResponseData,
} from "./interfaces/virtualAccount";
export * from "./interfaces";
export * from "./errors";

export class SquadGTBank {
    private axios: AxiosInstance = Axios.create({
        baseURL: this.instanceOptions.baseUrl,
        headers: {
            Authorization: `Bearer ${this.instanceOptions.apiKey}`,
        },
    });
    constructor(protected instanceOptions: SquadGTBankOptions) {}

    async createBusinessVirtualAccount(
        options: Omit<
            CreateBusinessVirtualAccountOptions,
            "beneficiary_account"
        >
    ) {
        try {
            const requestOptions: AxiosRequestConfig<CreateBusinessVirtualAccountOptions> =
                {
                    url: "/virtual-account/business",
                    method: "POST",
                    data: {
                        beneficiary_account:
                            this.instanceOptions.beneficiaryAccountNumber,
                        business_name: options.business_name,
                        bvn: options.bvn,
                        customer_identifier: options.customer_identifier,
                        mobile_num: options.mobile_num,
                    },
                };
            const { data } = await this.axios<
                SquadGTBankResponse<CreateBusinessVirtualAccountResponseData>
            >(requestOptions);

            return data;
        } catch (error) {
            if (!Axios.isAxiosError(error)) {
                throw error;
            }
            const err = new SquadGtBankVirtualAccountError(
                error.response?.data?.message ??
                    "Failed to create GTBank virtual account"
            );
            err.status = error.response.status;
            throw err;
        }
    }
}
