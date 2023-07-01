import { HttpException } from "@nestjs/common";

export class IRechargeWorkflowException extends HttpException {
    name = "IRechargeWorkflowException";
}

export class IRechargeElectricityException extends HttpException {
    name = "IRechargeElectricityException";
}
