import { HttpException } from "@nestjs/common";

export class TransactionNotFoundException extends HttpException {
    name: string = "TransactionNotFoundException";
}
