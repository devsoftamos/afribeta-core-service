import { HttpException } from "@nestjs/common";

export class IRechargeWorkflowException extends HttpException {
    name = "IRechargeWorkflowException";
}

//Power
export class IRechargePowerException extends HttpException {
    name = "IRechargePowerException";
}

export class IRechargeVendPowerException extends IRechargePowerException {
    name = "IRechargeVendPowerException";
}

export class IRechargeGetMeterInfoException extends IRechargePowerException {
    name = "IRechargeGetMeterInfoException";
}

//data
export class IRechargeDataException extends HttpException {
    name = "IRechargeDataException";
}

export class IRechargeVendDataException extends IRechargeDataException {
    name = "IRechargeVendDataException";
}
