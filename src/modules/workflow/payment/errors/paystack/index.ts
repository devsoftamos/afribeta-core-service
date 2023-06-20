import { HttpException } from "@nestjs/common";

export class PaystackWorkflowException extends HttpException {
    name = "PaystackWorkflowException";
}

export class PaystackBankException extends PaystackWorkflowException {
    name = "PaystackBankException";
}

export class PaystackTransferException extends PaystackWorkflowException {
    name = "PaystackTransferException";
}

export class PaystackVerifyTransactionException extends PaystackWorkflowException {
    name: string = "PaystackVerifyTransactionException";
}
