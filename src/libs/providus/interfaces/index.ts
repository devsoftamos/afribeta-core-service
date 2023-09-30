export * from "./virtualAccount";

export interface ProvidusOptions {
    clientId: string;
    authSignature: string;
    baseUrl: string;
}

export type ProvidusResponse<T = Record<string, never>> = {
    requestSuccessful: boolean;
    responseMessage: string;
    responseCode: string;
} & T;
