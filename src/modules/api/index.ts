import { Module } from "@nestjs/common";
import { AuthModule } from "./auth";
import { BankModule } from "./bank";
import { BillModule } from "./bill";
import { LocationModule } from "./location";
import { NotificationModule } from "./notification";
import { TransactionModule } from "./transaction";
import { UserModule } from "./user";
import { WalletModule } from "./wallet";
import { WebExtension } from "./webExtension";
import { CommissionModule } from "./commission";
import { AccessControlModule } from "./accessControl";

@Module({
    imports: [
        WebExtension,
        UserModule,
        AuthModule,
        WalletModule,
        BankModule,
        TransactionModule,
        BillModule,
        NotificationModule,
        LocationModule,
        CommissionModule,
        AccessControlModule,
    ],
})
export class APIModule {}
