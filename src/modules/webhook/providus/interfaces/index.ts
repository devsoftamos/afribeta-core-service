import { Request } from "express";

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

type SystemFailureOrRetryRequestReply = {
    responseMessage: "system failure" | "retry";
    responseCode: "03";
};

export type APIWebhookResponse = {
    requestSuccessful: true;
    sessionId: string;
} & (
    | SuccessRequestReply
    | DuplicateRequestReply
    | RejectedRequestReply
    | SystemFailureOrRetryRequestReply
);

export interface ProvidusWebhook {
    processWebhookEvent(eventBody: EventBody): Promise<APIWebhookResponse>;
}

interface ProvidusHeader {
    ["x-auth-signature"]: string;
}

export interface UserIdentifier {
    id: number;
    email: string;
    identifier: string;
}

export type RequestFromProvidus = Request<any, any, EventBody> & {
    headers: ProvidusHeader;
    body: EventBody;
    userIdentifier: UserIdentifier;
};
