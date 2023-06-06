export interface PaystackGenericData {
    [key: string]: any;
}

// type DedicatedAssignSuccessEvent = "dedicatedaccount.assign.success";
// type CustomerIdentificationEvent = "customeridentification.success";
// type ChargeSuccessEvent = "charge.success";
// export type Events =
//     | DedicatedAssignSuccessEvent
//     | CustomerIdentificationEvent
//     | ChargeSuccessEvent;

export enum Event {
    DedicatedAssignSuccessEvent = "dedicatedaccount.assign.success",
    CustomerIdentificationEvent = "customeridentification.success",
    ChargeSuccessEvent = "charge.success",
}
//
export interface EventBody<
    E extends Event = Event.CustomerIdentificationEvent
> {
    event: Event;
    data: E extends CustomerIdentificationSuccessData
        ? CustomerIdentificationSuccessData
        : DedicatedAccountAssignSuccessData;
}

export interface ChargeSuccessData {
    amount: number;
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
