import { EventEmitter } from "events";
import {
    BillEventMap,
    BillPaymentFailure,
    BillPurchaseFailure,
} from "../interfaces";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BillService } from "../services";

@Injectable()
export class BillEvent extends EventEmitter {
    constructor(
        @Inject(forwardRef(() => BillService))
        private billService: BillService
    ) {
        super();
        this.on("payment-failure", this.onPaymentFailure);
        this.on("bill-purchase-failure", this.onBillPurchaseFailure);
    }

    emit<K extends keyof BillEventMap>(
        eventName: K,
        payload: BillEventMap[K]
    ): boolean {
        return super.emit(eventName, payload);
    }

    on<K extends keyof BillEventMap>(
        eventName: K,
        listener: (payload: BillEventMap[K]) => void
    ) {
        return super.on(eventName, listener);
    }

    once<K extends keyof BillEventMap>(
        eventName: K,
        listener: (payload: BillEventMap[K]) => void
    ) {
        return super.on(eventName, listener);
    }

    off<K extends keyof BillEventMap>(
        eventName: K,
        listener: (payload: BillEventMap[K]) => void
    ) {
        return super.off(eventName, listener);
    }

    async onPaymentFailure(options: BillPaymentFailure) {
        await this.billService.paymentFailureHandler(options);
    }

    async onBillPurchaseFailure(options: BillPurchaseFailure) {
        await this.billService.billPurchaseFailureHandler(options);
    }
}
