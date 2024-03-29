import { HttpException } from "@nestjs/common";

export class UnprocessedTransactionException extends HttpException {
    name = "UnprocessedTransactionException";
}

export class VendFailureException extends HttpException {
    name = "VendFailureException";
}

export class VendInProgressException extends HttpException {
    name = "VendInProgressException";
}

//power
export class VendPowerFailureException extends VendFailureException {
    name = "VendPowerFailureException";
}

export class VendPowerInProgressException extends VendInProgressException {
    name = "VendPowerInProgressException";
}

//data
export class VendDataFailureException extends VendFailureException {
    name = "VendDataFailureException";
}

export class VendDataInProgressException extends VendInProgressException {
    name = "VendDataInProgressException";
}

//airtime
export class VendAirtimeFailureException extends VendFailureException {
    name = "VendAirtimeFailureException";
}

export class VendAirtimeInProgressException extends VendInProgressException {
    name = "VendAirtimeInProgressException";
}

//internet
export class VendInternetFailureException extends VendFailureException {
    name = "VendInternetFailureException";
}
export class VendInternetInProgressException extends VendInProgressException {
    name = "VendInternetInProgressException";
}

//cable tv
export class VendCableTVFailureException extends VendFailureException {
    name = "VendCableTVFailureException";
}

export class VendCableTVInProgressException extends VendInProgressException {
    name = "VendCableTVInProgressException";
}
