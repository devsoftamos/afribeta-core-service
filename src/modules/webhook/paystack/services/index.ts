import { Injectable } from "@nestjs/common";
import { PaystackEvent } from "../interfaces";

@Injectable()
export class PaystackWebhookService {
    // constructor() {}

    async processWebhook(event: PaystackEvent): Promise<void> {
        //handle event
        console.log(event);
    }
}
