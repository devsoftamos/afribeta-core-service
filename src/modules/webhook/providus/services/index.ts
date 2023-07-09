import { UserService } from "@/modules/api/user/services";
import { Injectable } from "@nestjs/common";
import { APIWebhookResponse, EventBody, ProvidusWebhook } from "../interfaces";

@Injectable()
export class ProvidusWebhookService implements ProvidusWebhook {
    constructor(private userService: UserService) {}
    processWebhookEvent(eventBody: EventBody): Promise<APIWebhookResponse> {
        console.log(eventBody, this.userService);
        throw new Error("Method not implemented.");
    }
}
