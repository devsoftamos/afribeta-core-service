import { HttpException } from "@nestjs/common";

export class DuplicateUserException extends HttpException {
    name = "DuplicateUserException";
}

export class UserNotFoundException extends HttpException {
    name = "UserNotFoundException";
}
