export enum BuyPowerReQueryQueue {
    POWER = "power",
    AIRTIME = "airtime",
    DATA = "data",
    CABLE_TV = "cable_tv",
    INTERNET = "internet",
}

export enum BillQueue {
    BUYPOWER_REQUERY = "buypowerReQuery",
}

export interface BuypowerReQueryJobOptions {
    orderId: string;
    transactionId: number;
    isWalletPayment: boolean;
}
