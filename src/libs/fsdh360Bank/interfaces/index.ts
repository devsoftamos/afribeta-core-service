export * from "./virtualAccount";

export interface FSDH360BankOptions {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
    identityUrl: string;
    merchantAccountNumber: string;
}

export interface GetTokenResponse {
    access_token: string;
}

export interface GetTokenOptions {
    client_id: string;
    client_secret: string;
    grant_type: "client_credentials";
}
