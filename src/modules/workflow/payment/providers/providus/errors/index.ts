import { HttpException } from "@nestjs/common";

export class ProvidusWorkflowException extends HttpException {
    name: string = "CreateVirtualAccountOptions";
}

export class providusVirtualAccountException extends HttpException {
    name: string = "providusVirtualAccountException";
}
