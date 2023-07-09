import { HttpException } from "@nestjs/common";

export class ProvidusWorkflowException extends HttpException {
    name = "CreateVirtualAccountOptions";
}

export class providusVirtualAccountException extends HttpException {
    name = "providusVirtualAccountException";
}
