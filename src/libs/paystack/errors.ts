export class PaystackError extends Error {
    name = "PaystackError";
    status = 500;
}

export class PaystackGenericError extends PaystackError {
    name = "PaystackGenericError";
}

export class PaystackAuthorizationError extends PaystackError {
    name = "PaystackAuthorizationError";
    status = 401;
}

export class PaystackValidationError extends PaystackError {
    name = "PaystackValidationError";
    status = 400;
}

export class PaystackNotFoundError extends PaystackError {
    name = "PaystackNotFoundError";
    status = 404;
}
