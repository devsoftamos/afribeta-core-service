import { HttpException } from "@nestjs/common";

export class InvalidBankProvider extends HttpException {
    name = "InvalidBankProvider";
}

export class VirtualAccountNotFoundException extends HttpException {
    name = "VirtualAccountNotFoundException";
}
