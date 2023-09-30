import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { createHash } from "crypto";
import { CreateVirtualAccountOptions, PolarisBankOptions } from "./interfaces";

export * from "./interfaces";
export * from "./errors";

export class PolarisBank {
    private axios: AxiosInstance = Axios.create({
        baseURL: this.instanceOptions.baseUrl,
    });

    constructor(protected instanceOptions: PolarisBankOptions) {}

    private getHeader(requestRef: string) {
        const signature = createHash("md5")
            .update(`${requestRef};${this.instanceOptions.clientSecret}`)
            .digest("hex");
        return {
            Authorization: `Bearer ${this.instanceOptions.apiKey}`,
            Signature: signature,
        };
    }

    async createVirtualAccount(options: CreateVirtualAccountOptions) {
        try {
            //nb add v2 in baseurl
            const requestOptions: AxiosRequestConfig<CreateVirtualAccountOptions> =
                {
                    headers: this.getHeader(options.requestRef),
                    method: "POST",
                    url: "/transact",
                    data: options, //update here
                };

            const { data } = await this.axios(requestOptions);
            return data;
        } catch (error) {}
    }
}
