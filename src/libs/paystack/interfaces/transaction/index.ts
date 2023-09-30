import { PaystackPaymentChannel } from "..";

export type Status = "success" | "abandoned" | "failed";
export interface VerifyTransactionResponseData {
    domain: string;
    status: Status;
    reference: string;
    amount: number;
    channel: string;
    currency: string;
    fees: number;
    authorization: {
        authorization_code: string;
        channel: PaystackPaymentChannel;
        card_type: string;
        bank: string;
        country_code: string;
        brand: string;
    };
    customer: {
        id: number;
        first_name: string | null;
        last_name: string | null;
        email: string;
        customer_code: string;
        phone: string | null;
    };
}
