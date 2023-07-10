import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    VERSION_NEUTRAL,
} from "@nestjs/common";
import { EventBody, RequestFromProvidus } from "../interfaces";
import { ProvidusWebhookService } from "../services";

@Controller({
    path: "providus",
    version: VERSION_NEUTRAL,
})
export class ProvidusWebhookController {
    constructor(
        private readonly providusWebhookService: ProvidusWebhookService
    ) {}
    @HttpCode(HttpStatus.OK)
    @Post()
    async processWebhook(
        @Body() eventBody: EventBody,
        @Req() req: RequestFromProvidus
    ) {
        return await this.providusWebhookService.processWebhookEvent(
            eventBody,
            req.userIdentifier
        );
    }
}
