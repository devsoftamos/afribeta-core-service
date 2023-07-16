import { PrismaService } from "@/modules/core/prisma/services";
import {
    GetDataBundleResponse,
    NetworkDataProvider,
} from "@/modules/workflow/billPayment";
import { IRechargeWorkflowService } from "@/modules/workflow/billPayment/providers/iRecharge/services";
import { ApiResponse, buildResponse } from "@/utils";
import { Injectable } from "@nestjs/common";
import { GetDataBundleDto } from "../dtos/data";
import { ProviderSlug } from "../interfaces";

@Injectable()
export class DataBillService {
    constructor(
        private iRechargeWorkflowService: IRechargeWorkflowService,
        private prisma: PrismaService
    ) {}

    async getDataBundles(options: GetDataBundleDto): Promise<ApiResponse> {
        let dataBundles: GetDataBundleResponse[] = [];
        const providers = await this.prisma.billProvider.findMany({
            where: { isActive: true },
        });

        for (const provider of providers) {
            switch (provider.slug) {
                case ProviderSlug.IRECHARGE: {
                    const iRechargeDataBundles =
                        await this.iRechargeWorkflowService.getDataBundles(
                            options.networkProvider
                        );
                    dataBundles = [...dataBundles, ...iRechargeDataBundles];
                    break;
                }

                default: {
                    dataBundles = [...dataBundles];
                }
            }
        }

        return buildResponse({
            message: "Successfully retrieved data bundles",
            data: dataBundles,
        });
    }
}
