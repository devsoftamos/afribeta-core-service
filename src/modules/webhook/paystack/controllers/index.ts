import { Body, Controller, Post, Res, VERSION_NEUTRAL } from "@nestjs/common";
import { Response } from "express";
import { PaystackEvent } from "../interfaces";
import { PaystackWebhookService } from "../services";

@Controller({
    path: "paystack",
    version: VERSION_NEUTRAL,
})
export class PaystackWebhookController {
    constructor(
        private readonly paystackWebhookService: PaystackWebhookService
    ) {}

    @Post()
    async processWebhook(@Body() event: PaystackEvent, @Res() res: Response) {
        res.sendStatus(200);
        await this.paystackWebhookService.processWebhook(event);
    }
}
