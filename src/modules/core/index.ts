import { Module } from "@nestjs/common";
import { AbilityModule } from "./ability";
import { EmailModule } from "./email";
import { PrismaModule } from "./prisma";
import { SmsModule } from "./sms";
import { UploadModule } from "./upload";

@Module({
    imports: [
        EmailModule,
        SmsModule,
        PrismaModule,
        AbilityModule,
        UploadModule,
    ],
})
export class CoreModule {}
