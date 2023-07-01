import { IRechargeWorkflowService } from "@/modules/workflow/billPayment/providers/iRecharge/services";
import { ApiResponse, buildResponse } from "@/utils";
import { Injectable } from "@nestjs/common";

@Injectable()
export class BillService {
    constructor(private iRechargeWorkflowService: IRechargeWorkflowService) {}

    async getElectricDiscos(): Promise<ApiResponse> {
        const discos = await this.iRechargeWorkflowService.getElectricDiscos();

        return buildResponse({
            message: "Electric discos successfully retrieved",
            data: discos,
        });
    }
}
