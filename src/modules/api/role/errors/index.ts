import { HttpException } from "@nestjs/common";

export class RoleNotFoundException extends HttpException {
    name = "RoleNotFoundException";
}
