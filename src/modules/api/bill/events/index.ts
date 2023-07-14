import { EventEmitter } from "events";
import { BillEventType, OnBillPurchaseFailure } from "../interfaces";
import logger from "moment-logger";
import { TransactionStatus } from "@prisma/client";

class BillEvent extends EventEmitter {
    constructor() {
        super();
        this.on(
            BillEventType.BILL_PURCHASE_FAILURE,
            this.onBillPurchaseFailure
        );
    }

    async onBillPurchaseFailure(options: OnBillPurchaseFailure) {
        const { prisma, transaction } = options;
        try {
            await prisma.transaction.update({
                where: {
                    id: transaction.id,
                },
                data: {
                    status: TransactionStatus.FAILED,
                },
            });
        } catch (error) {
            logger.error(error);
        }
    }
}

export const billEvent = new BillEvent();
