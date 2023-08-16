import { FSDH360BankWebhookGuard } from "@/modules/api/auth/guard";
import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
    VERSION_NEUTRAL,
} from "@nestjs/common";
import { FSDH360BankWebhookEvent } from "../events";
import { EventBody } from "../interfaces";

@UseGuards(FSDH360BankWebhookGuard)
@Controller({
    path: "fsdh360",
    version: VERSION_NEUTRAL,
})
export class FSDH360BankWebhookController {
    constructor(
        private readonly fsdh360BankWebhookEvent: FSDH360BankWebhookEvent
    ) {}

    @HttpCode(HttpStatus.OK)
    @Post()
    async processWebhook(@Body() eventBody: EventBody) {
        this.fsdh360BankWebhookEvent.emit("process-webhook-event", eventBody);
        return [eventBody.transactionId];
    }
}
