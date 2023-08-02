import { HttpException } from "@nestjs/common";

export class InsufficientPermissionException extends HttpException {
    name: string = "InsufficientPermissionException";
}

export class AuthorizationGenericException extends HttpException {
    name: string = "AuthorizationGenericException";
}
