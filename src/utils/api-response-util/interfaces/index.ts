import { PaginationMeta } from "@/utils/interfaces";

export interface ApiResponse<
    D extends Record<string, any> = Record<string, any>
> {
    success: boolean;
    message: string;
    data?: D | Record<string, any>;
}
export interface DataWithPagination<TData = Record<string, any>> {
    meta: PaginationMeta;
    records: TData[];
}
