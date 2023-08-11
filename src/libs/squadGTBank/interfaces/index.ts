export * from "./virtualAccount";

export interface SquadGTBankOptions {
    baseUrl: string;
    secretKey: string;
    beneficiaryAccountNumber?: string;
}

export type SquadGTBankResponse<TData = Record<string, any>> = {
    success: boolean;
    message: string;
    data: TData;
};
