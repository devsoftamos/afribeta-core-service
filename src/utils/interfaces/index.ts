export type Optional<T, Key extends keyof T> = Omit<T, Key> & Partial<T>;
export interface TransactionIdOption {
    type:
        | "transaction"
        | "reference"
        | "custom_upper_case"
        | "custom_lower_case"
        | "numeric"
        | "irecharge_ref"
        | "walletNumber"
        | "identifier";
    length?: number;
}

export interface PaginationMeta {
    perPage: number;
    page: number;
    pageCount: number;
    totalCount: number;
}

export interface Meta {
    [key: string]: string | number;
}

export type GroupBy<TData> = (key: string, data: TData[]) => any;
