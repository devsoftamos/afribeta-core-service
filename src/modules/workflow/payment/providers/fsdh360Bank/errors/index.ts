import { HttpException } from "@nestjs/common";

export class FSDH360BankException extends HttpException {
    name = "FSDH360BankException";
}

export class FSDH360BankVirtualAccountException extends FSDH360BankException {
    name = "FSDH360BankVirtualAccountException";
}

export class FSDH360BankBvnVerificationException extends FSDH360BankException {
    name = "FSDH360BankBvnVerificationException";
}
