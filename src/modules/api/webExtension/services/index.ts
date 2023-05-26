import { EmailService } from "@/modules/core/email/services";

import { Injectable } from "@nestjs/common";

@Injectable()
export class WebExtensionService {
    constructor(private brevoEmailService: EmailService) {}

    health() {
        return {
            success: true,
            message: "OK",
            timestamp: Date.now(),
        };
    }
}
