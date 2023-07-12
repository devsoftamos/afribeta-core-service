import { HttpException } from "@nestjs/common";

export class IRechargeWorkflowException extends HttpException {
    name = "IRechargeWorkflowException";
}

export class IRechargePowerException extends HttpException {
    name = "IRechargePowerException";
}
