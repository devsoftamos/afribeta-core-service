import {
    BillProvider,
    PaymentChannel,
    PaymentStatus,
    TransactionStatus,
    User,
    UserType,
    Wallet,
} from "@prisma/client";
import { PurchasePowerDto } from "../dtos";

export interface CompletePowerPurchaseOptions {
    user: CompletePowerPurchaseUserOptions;
    transaction: CompletePowerPurchaseTransactionOptions;
    billProvider: BillProvider;
}

export interface CompletePowerPurchaseTransactionOptions {
    id: number;
    billProviderId: number;
    serviceTransactionCode: string;
    userId: number;
    accountId: string;
    amount: number;
    senderIdentifier: string;
    receiverIdentifier: string;
    paymentStatus: PaymentStatus;
    status: TransactionStatus;
}

export interface CompletePowerPurchaseUserOptions {
    email: string;
    userType: UserType;
}

export interface PowerPurchaseInitializationHandlerOptions {
    purchaseOptions: PurchasePowerDto;
    user: User;
    billProvider: BillProvider;
    paymentChannel: PaymentChannel;
    wallet?: Wallet;
}

export interface CustomerMeterInfo {
    name: string;
    address: string;
    util: string;
    minimumAmount: number;
}
export interface PowerPurchaseInitializationHandlerOutput {
    paymentReference: string;
    customer: CustomerMeterInfo;
}

export interface CompletePowerPurchaseOutput {
    meterToken: string;
    units: string;
}
