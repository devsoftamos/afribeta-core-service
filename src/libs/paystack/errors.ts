export class PaystackError extends Error {
    name: string = "PaystackError";
    status: number = 500;
}

export class PaystackGenericError extends PaystackError {
    name: string = "PaystackGenericError";
}

export class PaystackAuthorizationError extends PaystackError {
    name: string = "PaystackAuthorizationError";
    status: number = 401;
}

export class PaystackValidationError extends PaystackError {
    name: string = "PaystackValidationError";
    status: number = 400;
}

export class PaystackNotFoundError extends PaystackError {
    name: string = "PaystackNotFoundError";
    status: number = 404;
}
