import { Paystack, PaystackOptions } from "@/libs/paystack";
import { Injectable } from "@nestjs/common";

@Injectable()
export class PaystackService extends Paystack {
    constructor(instanceOptions: PaystackOptions) {
        super(instanceOptions);
    }
}
