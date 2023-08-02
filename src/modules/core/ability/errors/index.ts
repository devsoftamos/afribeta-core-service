import { HttpException } from "@nestjs/common";

export class InsufficientPermissionException extends HttpException {
    name = "InsufficientPermissionException";
}

export class AuthorizationGenericException extends HttpException {
    name = "AuthorizationGenericException";
}
