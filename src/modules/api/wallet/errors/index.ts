import { HttpException } from "@nestjs/common";

export class WalletCreationException extends HttpException {
    name = "WalletCreationException";
}

export class DuplicateWalletException extends HttpException {
    name = "DuplicateWalletException";
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

export class InvalidWalletWithdrawalPaymentProvider extends HttpException {
    name = "InvalidWalletWithdrawalPaymentProvider";
}

export class InsufficientWalletBalanceException extends HttpException {
    name = "InsufficientWalletBalanceException";
}

export class DuplicateWalletWithdrawalTransaction extends HttpException {
    name = "DuplicateWalletWithdrawalTransaction";
}
