import { squadGtBankOptions } from "@/config";
import { SquadGTBank } from "@/libs/squadGTBank";
import { Global, Module } from "@nestjs/common";
import { SquadGTBankService } from "./services";

@Global()
@Module({
    providers: [
        {
            provide: SquadGTBankService,
            useFactory() {
                const squadGTBank = new SquadGTBank({
                    baseUrl: squadGtBankOptions.baseUrl,
                    secretKey: squadGtBankOptions.secretKey,
                    beneficiaryAccountNumber:
                        squadGtBankOptions.beneficiaryAccountNumber,
                });

                return new SquadGTBankService(squadGTBank);
            },
        },
    ],
    exports: [SquadGTBankService],
})
export class SquadGTBankWorkflowModule {}
