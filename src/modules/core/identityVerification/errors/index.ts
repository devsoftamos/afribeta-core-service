import { HttpException } from "@nestjs/common";

export class BvnVerificationException extends HttpException {
    name = "BvnVerificationException";
}
