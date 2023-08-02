import { Module } from "@nestjs/common";
import { AbilityModule } from "./ability";
import { EmailModule } from "./email";
import { PrismaModule } from "./prisma";
import { SmsModule } from "./sms";

@Module({
    imports: [EmailModule, SmsModule, PrismaModule, AbilityModule],
})
export class CoreModule {}
