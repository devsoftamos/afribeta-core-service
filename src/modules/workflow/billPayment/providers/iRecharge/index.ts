import { IRecharge } from "@/libs/iRecharge";
import { Global, Module } from "@nestjs/common";
import { IRechargeWorkflowService } from "./services";
import { iRechargeOptions } from "@/config";
import { PrismaService } from "@/modules/core/prisma/services";

@Global()
@Module({
    providers: [
        {
            provide: IRechargeWorkflowService,
            useFactory(prisma: PrismaService) {
                const iRecharge = new IRecharge({
                    baseUrl: iRechargeOptions.baseUrl,
                    privateKey: iRechargeOptions.privateKey,
                    publicKey: iRechargeOptions.publicKey,
                    vendorCode: iRechargeOptions.vendorCode,
                });
                return new IRechargeWorkflowService(iRecharge, prisma);
            },
            inject: [PrismaService],
        },
    ],
    exports: [IRechargeWorkflowService],
})
export class IRechargeWorkflowModule {}
