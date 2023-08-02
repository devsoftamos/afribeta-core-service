import { PaginationMeta } from "@/utils/interfaces";

export type Data<T = Record<string, any>> = T;
export interface ApiResponse<D extends Data = Data> {
    success: boolean;
    message: string;
    data?: D | Data;
}
export interface DataWithPagination {
    meta: PaginationMeta;
    records: Data[];
}
