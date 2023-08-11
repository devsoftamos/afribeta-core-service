export interface EventBody {
    customer_identifier: string;
    fee_charged: number;
    currency: string;
    principal_amount: number;
    sender_name: string;
    channel: "virtual-account";
    settled_amount: number;
    transaction_reference: string;
    virtual_account_number: string;
}

export interface WebhookEventMap {
    "process-webhook-event": EventBody;
}
