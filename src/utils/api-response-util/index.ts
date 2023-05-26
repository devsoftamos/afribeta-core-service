import { ApiResponse } from "./interfaces";
export * from "./interfaces";

export const buildResponse = (
    options: Omit<ApiResponse, "success">
): ApiResponse => {
    return {
        success: true,
        message: options.message,
        data: options.data ?? {},
    };
};
