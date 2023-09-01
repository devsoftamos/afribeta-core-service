import { termiiSmsOptions } from "@/config";
import { TermiiSms } from "@/libs/sms";
import { Global, Module } from "@nestjs/common";
import { SmsService } from "./services";
export * as SMS from "./interfaces";

@Global()
@Module({
    providers: [
        {
            provide: SmsService,
            useFactory() {
                const termiiSms = new TermiiSms({
                    apiKey: termiiSmsOptions.apiKey,
                    baseUrl: termiiSmsOptions.baseUrl,
                    sender: termiiSmsOptions.sender,
                });
                return new SmsService(termiiSms);
            },
        },
    ],
    exports: [SmsService],
})
export class SMSModule {}
