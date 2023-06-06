import { HttpException } from "@nestjs/common";

export class PaystackWorkflowGenericException extends HttpException {}

export class PaystackBankException extends PaystackWorkflowGenericException {
    name = "PaystackBankException";
}
