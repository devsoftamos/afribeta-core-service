import { HttpException } from "@nestjs/common";

export class IRechargeWorkflowException extends HttpException {
    name: string = "IRechargeWorkflowException";
}

export class IRechargeElectricityException extends HttpException {
    name: string = "IRechargeElectricityException";
}
