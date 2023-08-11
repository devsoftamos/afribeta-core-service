export interface EventBody {
    test: true;
}

export interface WebhookEventMap {
    "process-webhook-event": EventBody;
}
