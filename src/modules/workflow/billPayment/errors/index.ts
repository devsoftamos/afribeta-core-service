import { HttpException } from "@nestjs/common";

export class UnprocessedTransactionException extends HttpException {
    name: string = "UnprocessedTransactionException";
}
