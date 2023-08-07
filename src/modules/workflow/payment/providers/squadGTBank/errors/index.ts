import { HttpException } from "@nestjs/common";

export class SquadGTBankException extends HttpException {
    name = "SquadGTBankException";
}

export class SquadGTBankVirtualAccountException extends SquadGTBankException {
    name = "SquadGTBankVirtualAccountException";
}
