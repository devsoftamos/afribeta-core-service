import { PaystackWebhookGuard } from "@/modules/api/auth/guard";
import {
    Body,
    Controller,
    Post,
    Res,
    UseGuards,
    VERSION_NEUTRAL,
} from "@nestjs/common";
import { Response } from "express";
import { EventBody } from "../interfaces";
import { PaystackWebhookService } from "../services";

@UseGuards(PaystackWebhookGuard)
@Controller({
    path: "paystack",
    version: VERSION_NEUTRAL,
})
export class PaystackWebhookController {
    constructor(
        private readonly paystackWebhookService: PaystackWebhookService
    ) {}

    @Post()
    async processWebhook(@Body() eventBody: EventBody, @Res() res: Response) {
        res.sendStatus(200);
        await this.paystackWebhookService.processWebhookEvent(eventBody);
    }
}
