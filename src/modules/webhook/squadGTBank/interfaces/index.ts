export interface EventBody {
    customer_identifier: string;
    fee_charged: string;
    currency: string;
    principal_amount: string;
    sender_name: string;
    channel: "virtual-account";
    settled_amount: string;
    transaction_reference: string;
    virtual_account_number: string;
}

export interface WebhookEventMap {
    "process-webhook-event": EventBody;
}
