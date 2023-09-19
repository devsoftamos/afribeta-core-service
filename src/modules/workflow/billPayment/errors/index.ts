import { HttpException } from "@nestjs/common";

export class UnprocessedTransactionException extends HttpException {
    name = "UnprocessedTransactionException";
}

export class VendFailureException extends HttpException {
    name = "VendFailureException";
}

export class VendInProgressException extends HttpException {
    name: string = "VendInProgressException";
}

//power
export class VendPowerFailureException extends VendFailureException {
    name = "VendPowerFailureException";
}

export class VendPowerInProgressException extends VendInProgressException {
    name: string = "VendPowerInProgressException";
}

//data
export class VendDataFailureException extends VendFailureException {
    name = "VendDataFailureException";
}

export class VendDataInProgressException extends VendInProgressException {
    name: string = "VendDataInProgressException";
}

//airtime
export class VendAirtimeFailureException extends VendFailureException {
    name = "VendAirtimeFailureException";
}

export class VendAirtimeInProgressException extends VendInProgressException {
    name: string = "VendAirtimeInProgressException";
}
