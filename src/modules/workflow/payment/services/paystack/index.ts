import { Paystack, PaystackError, PaystackOptions } from "@/libs/paystack";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    PaystackBankException,
    PaystackWorkflowGenericException,
} from "../../errors";
import { ListBanks } from "../../interfaces";

@Injectable()
export class PaystackService extends Paystack {
    constructor(instanceOptions: PaystackOptions) {
        super(instanceOptions);
    }

    async getBankList(): Promise<ListBanks[]> {
        try {
            const list = await this.getBanks({ country: "nigeria" });
            return list.data.map((bank) => ({
                code: bank.code,
                name: bank.name,
            }));
        } catch (error) {
            switch (true) {
                case error instanceof PaystackError: {
                    throw new PaystackBankException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new PaystackWorkflowGenericException(
                        "Failed to retrieve banks",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }
}
