import { ApiResponse, Data } from "./interfaces";
export * from "./interfaces";

export function buildResponse<TData extends Data = Data>(
    options: Omit<ApiResponse<TData>, "success">
): ApiResponse<TData> {
    return {
        success: true,
        message: options.message,
        data: options.data ?? {},
    };
}
