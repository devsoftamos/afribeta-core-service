import { HttpException } from "@nestjs/common";

export class RoleNotFoundException extends HttpException {
    name = "RoleNotFoundException";
}

export class DuplicateRoleException extends HttpException {
    name = "DuplicateRoleException";
}

export class PermissionNotFoundException extends HttpException {
    name = "PermissionNotFoundException";
}
