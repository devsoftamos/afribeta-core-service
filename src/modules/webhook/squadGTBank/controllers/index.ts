import { SquadGTBankWebhookGuard } from "@/modules/api/auth/guard";
import {
    Body,
    Controller,
    Post,
    Res,
    UseGuards,
    VERSION_NEUTRAL,
} from "@nestjs/common";
import { Response } from "express";
import { SquadGTBankWebhookEvent } from "../events";
import { EventBody } from "../interfaces";

@UseGuards(SquadGTBankWebhookGuard)
@Controller({
    path: "gtbank",
    version: VERSION_NEUTRAL,
})
export class SquadGTBankWebhookController {
    constructor(
        private readonly squadGTBankWebhookEvent: SquadGTBankWebhookEvent
    ) {}

    @Post()
    async processWebhook(@Body() eventBody: EventBody, @Res() res: Response) {
        this.squadGTBankWebhookEvent.emit("process-webhook-event", eventBody);
        res.sendStatus(200);
    }
}
