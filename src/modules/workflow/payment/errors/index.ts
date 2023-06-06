import { HttpException } from "@nestjs/common";

export * from "./paystack";

export class PaymentWorkflowGenericException extends HttpException {
    name: string = "PaymentWorkflowGenericException";
}
