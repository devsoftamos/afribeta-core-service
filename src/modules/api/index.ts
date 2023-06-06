import { Module } from "@nestjs/common";
import { AuthModule } from "./auth";
import { UserModule } from "./user";
import { WalletModule } from "./wallet";
import { WebExtension } from "./webExtension";

@Module({
    imports: [WebExtension, UserModule, AuthModule, WalletModule],
})
export class APIModule {}
