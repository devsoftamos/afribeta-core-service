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
                    merchantBVN: squadGtBankOptions.merchantBVN,
                    merchantPrefix: squadGtBankOptions.merchantPrefix,
                });

                return new SquadGTBankService(squadGTBank);
            },
        },
    ],
    exports: [SquadGTBankService],
})
export class SquadGTBankWorkflowModule {}
