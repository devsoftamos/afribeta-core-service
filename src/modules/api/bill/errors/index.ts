import { HttpException } from "@nestjs/common";

export class BuyPowerException extends HttpException {
    name: string = "BuyPowerException";
}
