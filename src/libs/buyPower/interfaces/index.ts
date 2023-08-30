export * as Power from "./power";

export interface BuyPowerOptions {
    baseUrl: string;
    token: string;
}

export interface BuyPowerResponse<
    D extends Record<string, any> = Record<string, any>
> {
    status: boolean;
    responseCode: number;
    data: D;
}
