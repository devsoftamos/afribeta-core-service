import { HttpException } from "@nestjs/common";

export class WalletCreationException extends HttpException {
    name = "WalletCreationException";
}

export class DuplicateWalletException extends HttpException {
    name = "DuplicateWalletException";
}

export class WalletCreationPaystackException extends HttpException {
    name = "WalletCreationPaystackException";
}

export class WalletNotFoundException extends HttpException {
    name = "WalletNotFoundException";
}

export class InvalidWalletFundTransactionFlow extends HttpException {
    name = "InvalidWalletFundTransactionFlow";
}

export class DuplicateSelfFundWalletTransaction extends HttpException {
    name = "DuplicateSelfFundWalletTransaction";
}
