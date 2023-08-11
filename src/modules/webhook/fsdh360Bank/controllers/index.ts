import { Body, Controller, Post, Res, VERSION_NEUTRAL } from "@nestjs/common";
import { Response } from "express";
import { FSDH360BankWebhookEvent } from "../events";
import { EventBody } from "../interfaces";

@Controller({
    path: "fsdh360",
    version: VERSION_NEUTRAL,
})
export class FSDH360BankWebhookController {
    constructor(
        private readonly fsdh360BankWebhookEvent: FSDH360BankWebhookEvent
    ) {}

    @Post()
    async processWebhook(@Body() eventBody: EventBody, @Res() res: Response) {
        this.fsdh360BankWebhookEvent.emit("process-webhook-event", eventBody);
        res.sendStatus(200);
    }
}
