import {
    BillProvider,
    PaymentStatus,
    TransactionStatus,
    UserType,
} from "@prisma/client";

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
