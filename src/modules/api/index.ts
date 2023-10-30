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
import { BullModule } from "@nestjs/bull";
import { redisUrl } from "@/config";
import { CommissionModule } from "./commission";
import { RolesModule } from "./role";
import { PermissionModule } from "./permissions";

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
        BullModule.forRoot({
            url: redisUrl,
        }),
        CommissionModule,
        RolesModule,
        PermissionModule,
    ],
})
export class APIModule {}
