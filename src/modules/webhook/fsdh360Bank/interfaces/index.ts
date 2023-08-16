export interface EventBody {
    transactionId: string;
    virtualAccountNumber: string;
    virtualAccountName: string;
    collectionAccountNumber: string;
    transactionType: string;
    amount: number;
    charge: number;
    vat: number;
    narration: string;
    transactionDate: string;
    counterPartyAccountNumber: string;
    counterPartyAccountName: string;
    transactionCurrency: "NGN";
    transactionPlatform: string;
    sendingInstitutionCode: string;
    sendingInstitutionName: string;
}

export interface WebhookEventMap {
    "process-webhook-event": EventBody;
}
