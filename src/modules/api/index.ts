import { Module } from "@nestjs/common";
import { AuthModule } from "./auth";
import { BankModule } from "./bank";
import { BillModule } from "./bill";
import { TransactionModule } from "./transaction";
import { UserModule } from "./user";
import { WalletModule } from "./wallet";
import { WebExtension } from "./webExtension";

@Module({
    imports: [
        WebExtension,
        UserModule,
        AuthModule,
        WalletModule,
        BankModule,
        TransactionModule,
        BillModule,
    ],
})
export class APIModule {}
