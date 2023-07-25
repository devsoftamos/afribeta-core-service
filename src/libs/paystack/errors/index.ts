export class PaystackError extends Error {
    name: string = "PaystackError";
    status: number;
}

export class PaystackGenericError extends PaystackError {
    name: string = "PaystackGenericError";
    status: number;
}

export class PaystackAuthorizationError extends PaystackError {
    name: string = "PaystackAuthorizationError";
    status = 401;
}

export class PaystackValidationError extends PaystackError {
    name: string = "PaystackValidationError";
    status = 400;
}

export class PaystackNotFoundError extends PaystackError {
    name: string = "PaystackNotFoundError";
    status = 404;
}

export class PaystackUnprocessableError extends PaystackError {
    name: string = "PaystackUnprocessableError";
    status = 422;
}
