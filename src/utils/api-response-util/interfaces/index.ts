export interface Data {
    [key: string]: any;
}
export interface ApiResponse<D extends Data = Data> {
    success: boolean;
    message: string;
    data?: D;
}
