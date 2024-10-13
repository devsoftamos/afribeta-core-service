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

//internet
export class IRechargeInternetException extends HttpException {
    name = "IRechargeInternetException";
}

export class IRechargeVendInternetException extends IRechargeInternetException {
    name = "IRechargeVendInternetException";
}

//cable tv
export class IRechargeCableTVException extends HttpException {
    name = "IRechargeCableTVException";
}

export class IRechargeVendCableTVException extends IRechargeCableTVException {
    name = "IRechargeVendCableTVException";
}

//wallet
export class IRechargeWalletException extends HttpException {
    name = "IRechargeWalletException";
}

//status
export class IRechargeVendStatusException extends HttpException {
    name = "IRechargeVendStatusException";
}
