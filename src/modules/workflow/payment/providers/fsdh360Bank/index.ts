import { fsdh360BankOptions } from "@/config";
import { FSDH360Bank } from "@/libs/fsdh360Bank";
import { Global, Module } from "@nestjs/common";
import { FSDH360BankService } from "./services";

@Global()
@Module({
    providers: [
        {
            provide: FSDH360BankService,
            useFactory() {
                const fsdh360Bank = new FSDH360Bank({
                    baseUrl: fsdh360BankOptions.baseUrl,
                    clientId: fsdh360BankOptions.clientId,
                    clientSecret: fsdh360BankOptions.clientSecret,
                    merchantAccountNumber:
                        fsdh360BankOptions.merchantAccountNumber,
                    tokenUrl: fsdh360BankOptions.tokenUrl,
                });

                return new FSDH360BankService(fsdh360Bank);
            },
        },
    ],
    exports: [FSDH360BankService],
})
export class FSDH360BankWorkflowModule {}
