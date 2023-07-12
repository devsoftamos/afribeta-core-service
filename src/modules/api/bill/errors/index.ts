import { HttpException } from "@nestjs/common";

export class BuyPowerException extends HttpException {
    name = "BuyPowerException";
}

export class DuplicatePowerPurchaseException extends HttpException {
    name = "DuplicatePowerPurchaseException";
}

export class BillProviderNotFoundException extends HttpException {
    name = "BillProviderNotFoundException";
}
