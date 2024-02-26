import { HttpException } from "@nestjs/common";

export class BillProviderNotFoundException extends HttpException {
    name = "BillProviderNotFoundException";
}
export class InvalidBillProviderException extends HttpException {
    name = "InvalidBillProviderException";
}

export class InvalidBillTypePaymentReference extends HttpException {
    name = "InvalidBillTypePaymentReference";
}

//power
export class PowerPurchaseInitializationHandlerException extends HttpException {
    name = "PowerPurchaseInitializationHandlerException";
}

export class PowerPurchaseException extends HttpException {
    name = "PowerPurchaseException";
}

export class DuplicatePowerPurchaseException extends HttpException {
    name = "DuplicatePowerPurchaseException";
}

export class UnavailableBillProviderDisco extends HttpException {
    name = "UnavailableBillProviderDisco";
}

//data
export class DataPurchaseException extends HttpException {
    name = "DataPurchaseException";
}

export class DuplicateDataPurchaseException extends HttpException {
    name = "DuplicateDataPurchaseException";
}

export class UnavailableBillProviderDataNetwork extends HttpException {
    name = "UnavailableBillProviderDataNetwork";
}

//Airtime
export class DuplicateAirtimePurchaseException extends HttpException {
    name = "DuplicateAirtimePurchaseException";
}

export class AirtimePurchaseException extends HttpException {
    name = "AirtimePurchaseException";
}

export class UnavailableBillProviderAirtimeNetwork extends HttpException {
    name = "UnavailableBillProviderAirtimeNetwork";
}

//Internet
export class InternetPurchaseException extends HttpException {
    name = "InternetPurchaseException";
}

export class DuplicateInternetPurchaseException extends HttpException {
    name = "DuplicateInternetPurchaseException";
}

//TV
export class CableTVPurchaseException extends HttpException {
    name = "CableTVPurchaseException";
}

export class DuplicateCableTVPurchaseException extends HttpException {
    name = "DuplicateCableTVPurchaseException";
}

export class ComputeBillCommissionException extends HttpException {
    name = "ComputeBillCommissionException";
}

export class PayBillCommissionException extends HttpException {
    name = "PayBillCommissionException";
}

export class CableTVPurchaseInitializationHandlerException extends HttpException {
    name = "CableTVPurchaseInitializationHandlerException";
}

//wallet

export class WalletChargeException extends HttpException {
    name = "WalletChargeException";
}

export class BillPaymentValidationException extends HttpException {
    name = "BillPaymentValidationException";
}
