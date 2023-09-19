export enum BuyPowerReQueryQueue {
    POWER = "power",
    AIRTIME = "airtime",
}

export enum BillQueue {
    BUYPOWER_REQUERY = "buypowerReQuery",
}

export interface BuypowerReQueryJobOptions {
    orderId: string;
    transactionId: number;
    isWalletPayment: boolean;
}
