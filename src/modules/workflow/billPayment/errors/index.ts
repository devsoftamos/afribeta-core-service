import { HttpException } from "@nestjs/common";

export class UnprocessedTransactionException extends HttpException {
    name = "UnprocessedTransactionException";
}

export class VendPowerFailureException extends HttpException {
    name = "VendPowerFailureException";
}
