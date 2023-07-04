export type Optional<T, Key extends keyof T> = Omit<T, Key> & Partial<T>;
export interface TransactionIdOption {
    type:
        | "transaction"
        | "reference"
        | "custom_upper_case"
        | "custom_lower_case";
    length?: number;
}
