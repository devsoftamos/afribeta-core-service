import { HttpException } from "@nestjs/common";

export class UserUnauthorizedException extends HttpException {
    name = "UserUnauthorizedException";
}

export class InvalidAuthTokenException extends HttpException {
    name = "InvalidAuthTokenException";
}

export class AuthTokenValidationException extends HttpException {
    name = "AuthTokenValidationException";
}

export class InvalidCredentialException extends HttpException {
    name = "InvalidCredentialException";
}

export class SendVerificationEmailException extends HttpException {
    name: string = "SendVerificationEmailException";
}

export class InvalidEmailVerificationCodeException extends HttpException {
    name = "InvalidEmailVerificationCodeException";
}

export class VerificationCodeExpiredException extends HttpException {
    name = "VerificationCodeExpiredException";
}