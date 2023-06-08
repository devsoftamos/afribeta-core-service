export interface PaystackGenericData {
    [key: string]: any;
}

export enum Event {
    DedicatedAssignSuccessEvent = "dedicatedaccount.assign.success",
    CustomerIdentificationSuccessEvent = "customeridentification.success",
    ChargeSuccessEvent = "charge.success",
}

export interface EventBody<E extends Event = Event> {
    event: E;
    data: E extends keyof EventDataMap ? EventDataMap[E] : never;
}

type EventDataMap = {
    [Event.DedicatedAssignSuccessEvent]: DedicatedAccountAssignSuccessData;
    [Event.CustomerIdentificationSuccessEvent]: CustomerIdentificationSuccessData;
    [Event.ChargeSuccessEvent]: ChargeSuccessData;
};

//charge.success data (both normal and transfer)
export interface ChargeSuccessData<Meta = PaystackGenericData> {
    id: number;
    amount: number;
    domain: string;
    status: string;
    reference: string;
    channel: string;
    currency: string;
    customer: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        customer_code: string;
        phone: string;
        metadata: Meta;
    };
    authorization: {
        authorization_code: string;
        card_type: string;
        bank: string;
        country_code: string;
        brand: string;
        account_name?: string;
        channel?: string;
        sender_bank?: string;
        sender_bank_account_number?: string;
        sender_country?: string;
        sender_name?: string;
        narration?: string;
        receiver_bank_account_number?: string;
        receiver_bank?: string;
    };
}

//customer identification success
export interface CustomerIdentificationSuccessData {
    customer_code: string;
    customer_id: string;
    email: string;
    identification: {
        bank_code: string;
        country: string;
        type: string;
    };
}

//dedicated account assign success
export interface DedicatedAccountAssignSuccessData {
    customer: {
        customer_code: string;
        email: string;
        first_name: string;
        last_name: string;
        id: string;
        meta: PaystackGenericData;
        phone: string;
    };
    dedicated_account: {
        account_name: string;
        account_number: string;
        active: boolean;
        assigned: boolean;
        bank: {
            id: number;
            name: string;
            slug: string;
        };
        assignment: {
            account_type: string;
        };
    };
}

export interface PaystackWebhook {
    processWebhookEvent(eventBody: EventBody): Promise<void>;
}
