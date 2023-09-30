import { HttpException } from "@nestjs/common";

export class PaystackWorkflowException extends HttpException {
    name = "PaystackWorkflowException";
}

export class PaystackBankException extends HttpException {
    name = "PaystackBankException";
}

export class PaystackTransferException extends HttpException {
    name = "PaystackTransferException";
}

export class PaystackVerifyTransactionException extends HttpException {
    name = "PaystackVerifyTransactionException";
}

export class PaystackDynamicVirtualAccountException extends HttpException {
    name = "PaystackDynamicVirtualAccountException";
}
