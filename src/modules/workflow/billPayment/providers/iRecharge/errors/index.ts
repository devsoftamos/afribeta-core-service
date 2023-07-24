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

//Airtime
export class IRechargeAirtimeException extends HttpException {
    name = "IRechargeDataException";
}
export class IRechargeVendAirtimeException extends IRechargeAirtimeException {
    name = "IRechargeVendAirtimeException";
}

//cable tv
export class IRechargeCableTVException extends HttpException {
    name: string = "IRechargeCableTVException";
}

export class IRechargeVendCableTVException extends IRechargeCableTVException {
    name: string = "IRechargeVendCableTVException";
}
