import { UserService } from "@/modules/api/user/services";
import { WalletService } from "@/modules/api/wallet/services";
import { Injectable } from "@nestjs/common";
import { EventBody } from "../interfaces";

@Injectable()
export class FSDH360BankWebhookService {
    constructor(
        private walletService: WalletService,
        private userService: UserService
    ) {}

    async processWebhookEvent(eventBody: EventBody) {
        await this.processWalletFunding(eventBody);
    }

    async processWalletFunding(eventBody: EventBody) {
        this.walletService;
        this.userService;
        eventBody;
    }
}
