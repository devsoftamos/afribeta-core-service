export class SmsFieldValidationException extends Error {
    name = "SmsFieldValidationException";
}

export class TermiiException extends Error {
    name = "TermiiException";
    response: any;
}
