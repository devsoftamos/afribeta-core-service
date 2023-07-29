export type Optional<T, Key extends keyof T> = Omit<T, Key> & Partial<T>;
export interface TransactionIdOption {
    type:
        | "transaction"
        | "reference"
        | "custom_upper_case"
        | "custom_lower_case"
        | "numeric";
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
