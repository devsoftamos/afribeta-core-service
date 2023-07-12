import { Injectable } from "@nestjs/common";
import { TransactionType } from "@prisma/client";
import { ProcessBillPaymentOptions } from "../interfaces";
import logger from "moment-logger";
import { PowerBillService } from "./power";

@Injectable()
export class BillService {
    constructor(private powerBillService: PowerBillService) {}

    async handleWebhookSuccessfulBillPayment(
        options: ProcessBillPaymentOptions
    ) {
        switch (options.billType) {
            case TransactionType.ELECTRICITY_BILL: {
                await this.powerBillService.processWebhookPowerPurchase({
                    billType: options.billType,
                    paymentReference: options.paymentReference,
                });
                break;
            }

            default: {
                logger.error(
                    "Failed to complete bill purchase. Invalid bill type"
                );
            }
        }
    }
}
