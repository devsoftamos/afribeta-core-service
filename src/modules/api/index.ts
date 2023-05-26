import { Module } from "@nestjs/common";
import { AuthModule } from "./auth";
import { UserModule } from "./user";
import { WebExtension } from "./webExtension";

@Module({
    imports: [WebExtension, UserModule, AuthModule],
})
export class APIModule {}
