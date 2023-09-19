import { HttpException } from "@nestjs/common";

export class BuyPowerVendInProgressException extends HttpException {
    name = "BuyPowerVendInProgressException";
}

//Power
export class BuyPowerPowerException extends HttpException {
    name = "BuyPowerPowerException";
}

export class BuyPowerVendPowerException extends BuyPowerPowerException {
    name = "BuyPowerVendPowerException";
}

//Airtime
export class BuyPowerAirtimeException extends HttpException {
    name = "BuyPowerAirtimeException";
}

export class BuyPowerVendAirtimeException extends BuyPowerAirtimeException {
    name = "BuyPowerVendAirtimeException";
}

//data
export class BuyPowerDataException extends HttpException {
    name = "BuyPowerDataException";
}

export class BuyPowerVendDataException extends BuyPowerAirtimeException {
    name = "BuyPowerVendDataException";
}

//internet
export class BuyPowerInternetException extends HttpException {
    name = "BuyPowerInternetException";
}

export class BuyPowerVendInternetException extends BuyPowerInternetException {
    name = "BuyPowerVendInternetException";
}

//cable tv
export class BuyPowerCableTVException extends HttpException {
    name = "BuyPowerCableTVException";
}

export class BuyPowerVendCableTVException extends BuyPowerCableTVException {
    name = "BuyPowerVendCableTVException";
}

//requery
export class BuyPowerRequeryException extends HttpException {
    name: string = "BuyPowerRequeryException";
}
