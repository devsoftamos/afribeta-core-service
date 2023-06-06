import { UserService } from "@/modules/api/user/services";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ProvidusBankWebhookService {
    constructor(private userService: UserService) {}
}
