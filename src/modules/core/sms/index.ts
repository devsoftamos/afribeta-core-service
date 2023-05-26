import { Global, Module } from "@nestjs/common";
import { SmsService } from "./services";

@Global()
@Module({
    providers: [SmsService],
    exports: [SmsService],
})
export class SmsModule {}
