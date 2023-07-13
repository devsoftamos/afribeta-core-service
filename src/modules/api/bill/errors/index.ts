import { HttpException } from "@nestjs/common";

export class PowerPurchaseException extends HttpException {
    name = "PowerPurchaseException";
}

export class DuplicatePowerPurchaseException extends HttpException {
    name = "DuplicatePowerPurchaseException";
}

export class BillProviderNotFoundException extends HttpException {
    name = "BillProviderNotFoundException";
}

export class PowerPurchaseInitializationHandlerException extends HttpException {
    name: string = "PowerPurchaseInitializationHandlerException";
}
