import { isProduction } from "@/config";

import { Injectable } from "@nestjs/common";

@Injectable()
export class WebExtensionService {
    health() {
        return {
            success: true,
            message: "OK",
            timestamp: Date.now(),
            env: process.env.NODE_ENV,
            production: isProduction,
        };
    }
}
