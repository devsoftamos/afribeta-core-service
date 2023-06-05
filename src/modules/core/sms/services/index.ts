import { SMS_SENDER_ID, termiiApiKey } from "@/config";
import { Sms } from "@/libs/sms";
import { UserService } from "@/modules/api/user/services";
import { Injectable } from "@nestjs/common";

@Injectable()
export class SmsService {
    termii: Sms<"termii">;
    constructor() {
        this.termii = new Sms({
            apiKey: termiiApiKey,
            provider: "termii",
            from: SMS_SENDER_ID,
        });
    }
}
