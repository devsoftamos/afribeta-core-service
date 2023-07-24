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
    name = "PowerPurchaseInitializationHandlerException";
}

export class InvalidBillTypePaymentReference extends HttpException {
    name = "InvalidBillTypePaymentReference";
}

export class DataPurchaseException extends HttpException {
    name = "DataPurchaseException";
}

export class DuplicateDataPurchaseException extends HttpException {
    name = "DuplicateDataPurchaseException";
}

export class WalletChargeException extends HttpException {
    name = "WalletChargeException";
}

export class InvalidBillProviderException extends HttpException {
    name = "InvalidBillProviderException";
}

export class DuplicateAirtimePurchaseException extends HttpException {
    name: string = "DuplicateAirtimePurchaseException";
}

export class AirtimePurchaseException extends HttpException {
    name = "AirtimePurchaseException";
}
