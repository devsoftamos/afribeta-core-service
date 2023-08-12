import { EventEmitter } from "events";
import {
    BillEventMap,
    BillPaymentFailure,
    BillPurchaseFailure,
    ComputeBillCommissionOptions,
    PayBillCommissionOptions,
} from "../interfaces";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { BillService } from "../services";
import { UserType } from "@prisma/client";

@Injectable()
export class BillEvent extends EventEmitter {
    constructor(
        @Inject(forwardRef(() => BillService))
        private billService: BillService
    ) {
        super();
        this.on("payment-failure", this.onPaymentFailure);
        this.on("bill-purchase-failure", this.onBillPurchaseFailure);
        this.on("compute-bill-commission", this.onComputeBillCommission);
        this.on("pay-bill-commission", this.onPayBillCommission);
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

    async onPaymentFailure(options: BillPaymentFailure) {
        await this.billService.paymentFailureHandler(options);
    }

    async onBillPurchaseFailure(options: BillPurchaseFailure) {
        await this.billService.billPurchaseFailureHandler(options);
    }

    async onComputeBillCommission(options: ComputeBillCommissionOptions) {
        if (
            options.userType == UserType.MERCHANT ||
            options.userType == UserType.AGENT
        ) {
            await this.billService.computeBillCommissionHandler(
                options.transactionId
            );
        }
    }

    async onPayBillCommission(options: PayBillCommissionOptions) {
        if (
            options.userType == UserType.MERCHANT ||
            options.userType == UserType.AGENT
        ) {
            await this.billService.payBillCommissionHandler(
                options.transactionId
            );
        }
    }
}
