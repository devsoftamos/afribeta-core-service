export class TermiiException extends Error {
    name = "TermiiException";
    response: Record<string, any>;
}
