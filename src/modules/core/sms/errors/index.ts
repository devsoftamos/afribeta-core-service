import { HttpException } from "@nestjs/common";

export class TermiiSmsException extends HttpException {
    name = "TermiiSmsException";
}

export class SmsGenericException extends HttpException {
    name = "SmsGenericException";
}
