import { HttpException } from "@nestjs/common";

export class WalletCreationException extends HttpException {
    name: string = "WalletCreationException";
}

export class DuplicateWalletException extends HttpException {
    name: string = "DuplicateWalletException";
}

export class WalletCreationPaystackException extends HttpException {
    name: string = "WalletCreationPaystackException";
}
