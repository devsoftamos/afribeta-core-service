export interface PaystackEvent<
    D extends ChargeSuccessData = ChargeSuccessData
> {
    event: string;
    data: D;
}

export interface ChargeSuccessData {
    amount: number;
}
