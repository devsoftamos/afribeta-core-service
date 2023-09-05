import { HttpException } from "@nestjs/common";

export class BuyPowerVendInProgressError extends HttpException {
    name: string = "BuyPowerVendInProgressError";
}

//Power
export class BuyPowerPowerException extends HttpException {
    name = "BuyPowerPowerException";
}

export class BuyPowerVendPowerException extends BuyPowerPowerException {
    name: string = "BuyPowerVendPowerException";
}


//Airtime
export class BuyPowerAirtimeException extends HttpException {
    name: string = "BuyPowerAirtimeException";
}

export class BuyPowerVendAirtimeException extends BuyPowerAirtimeException {
    name: string = "BuyPowerVendAirtimeException";
}

//data
export class BuyPowerDataException extends HttpException {
    name: string = "BuyPowerDataException";
}

export class BuyPowerVendDataException extends BuyPowerAirtimeException {
    name: string = "BuyPowerVendDataException";
}

//internet
export class BuyPowerInternetException extends HttpException {
    name: string = "BuyPowerInternetException";
}

export class BuyPowerVendInternetException extends BuyPowerInternetException {
    name: string = "BuyPowerVendInternetException";
}

//cable tv
export class BuyPowerCableTVException extends HttpException {
    name: string = "BuyPowerCableTVException";
}

export class BuyPowerVendCableTVException extends BuyPowerCableTVException {
    name: string = "BuyPowerVendCableTVException";
}
