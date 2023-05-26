import { Module } from "@nestjs/common";
import { EmailModule } from "./email";
import { PrismaModule } from "./prisma";
import { SmsModule } from "./sms";

@Module({
    imports: [EmailModule, SmsModule, PrismaModule],
})
export class CoreModule {}
