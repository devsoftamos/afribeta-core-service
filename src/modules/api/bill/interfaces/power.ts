import {
    BillProvider,
    PaymentStatus,
    TransactionStatus,
    UserType,
} from "@prisma/client";

export interface CompletePowerPurchaseOptions {
    user: {
        email: string;
        userType: UserType;
    };
    transaction: {
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
    };
    billProvider: BillProvider;
}
