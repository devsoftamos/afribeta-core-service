import { HttpException } from "@nestjs/common";

export class RoleNotFoundException extends HttpException {
    name = "RoleNotFoundException";
}

export class DuplicateRoleException extends HttpException {
    name = "DuplicateRoleException";
}
