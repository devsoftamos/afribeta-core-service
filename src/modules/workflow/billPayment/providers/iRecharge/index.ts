import { IRecharge } from "@/libs/iRecharge";
import { Global, Module } from "@nestjs/common";
import { IRechargeWorkflowService } from "./services";
import { iRechargeOptions } from "@/config";
export * from "./errors";

@Global()
@Module({
    providers: [
        {
            provide: IRechargeWorkflowService,
            useFactory() {
                const iRecharge = new IRecharge({
                    baseUrl: iRechargeOptions.baseUrl,
                    privateKey: iRechargeOptions.privateKey,
                    publicKey: iRechargeOptions.publicKey,
                    vendorCode: iRechargeOptions.vendorCode,
                });
                return new IRechargeWorkflowService(iRecharge);
            },
        },
    ],
    exports: [IRechargeWorkflowService],
})
export class IRechargeWorkflowModule {}
