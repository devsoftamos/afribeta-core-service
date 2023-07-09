export interface EventBody {
    sessionId: string;
    accountNumber: string;
    tranRemarks: string;
    transactionAmount: string;
    settledAmount: string;
    feeAmount: string;
    vatAmount: string;
    currency: "NGN";
    initiationTranRef: string;
    settlementId: string;
    sourceAccountNumber: string;
    sourceAccountName: string;
    sourceBankName: string;
    channelId: string;
    tranDateTime: string;
}

type SuccessRequestReply = {
    responseMessage: "success";
    responseCode: "00";
};

type DuplicateRequestReply = {
    responseMessage: "duplicate transaction";
    responseCode: "01";
};

type RejectedRequestReply = {
    responseMessage: "rejected transaction";
    responseCode: "02";
};

export type APIWebhookResponse = {
    requestSuccessful: true;
    sessionId: string;
} & (SuccessRequestReply | DuplicateRequestReply | RejectedRequestReply);

export interface ProvidusWebhook {
    processWebhookEvent(eventBody: EventBody): Promise<APIWebhookResponse>;
}
