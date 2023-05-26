export class SmsFieldValidationException extends Error {
    name: string = "SmsFieldValidationException";
}

export class TermiiException extends Error {
    name: string = "TermiiException";
    response: any;
}
