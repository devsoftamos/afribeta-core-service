import { HttpException } from "@nestjs/common";

export class ProvidusWorkflowException extends HttpException {
    name = "ProvidusWorkflowException";
}

export class providusVirtualAccountException extends HttpException {
    name = "providusVirtualAccountException";
}
