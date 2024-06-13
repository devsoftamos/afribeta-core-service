import { EventEmitter } from "events";
import { WalletEventMap } from "../interfaces";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { WalletService } from "../services";
import * as i from "../interfaces";

@Injectable()
export class WalletEvent extends EventEmitter {
    constructor(
        @Inject(forwardRef(() => WalletService))
        private walletService: WalletService
    ) {
        super();
        this.on("create-agency-wallet", this.onCreateAgencyWallet);
    }

    emit<K extends keyof WalletEventMap>(
        eventName: K,
        payload: WalletEventMap[K]
    ): boolean {
        return super.emit(eventName, payload);
    }

    on<K extends keyof WalletEventMap>(
        eventName: K,
        listener: (payload: WalletEventMap[K]) => void
    ) {
        return super.on(eventName, listener);
    }

    async onCreateAgencyWallet(options: i.CreateAgencyWallet) {
        await this.walletService.createAgencyWalletHandler(options);
    }
}
