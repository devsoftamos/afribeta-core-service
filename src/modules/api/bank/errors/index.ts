import { HttpException } from "@nestjs/common";

export class InvalidBankProvider extends HttpException {
    name = "InvalidBankProvider";
}

export class VirtualAccountNotFoundException extends HttpException {
    name = "VirtualAccountNotFoundException";
}

export class DuplicateBankAccountException extends HttpException {
    name = "DuplicateBankAccountException";
}

export class BankAccountNotFoundException extends HttpException {
    name: string = "BankAccountNotFoundException";
}
