import { HttpException } from "@nestjs/common";

export class InvalidEmailProviderException extends HttpException {
    name: string = "InvalidEmailProviderException";
}
