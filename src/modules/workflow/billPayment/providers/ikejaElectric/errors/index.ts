import { HttpException } from "@nestjs/common";

//Power
export class IkejaElectricPowerException extends HttpException {
    name = "IkejaElectricPowerException";
}

export class IkejaElectricVendPowerException extends IkejaElectricPowerException {
    name = "IkejaElectricVendPowerException";
}
