import { HttpException } from "@nestjs/common";

export class DuplicateUserException extends HttpException {
    name = "DuplicateUserException";
}

export class UserNotFoundException extends HttpException {
    name = "UserNotFoundException";
}

export class IncorrectPasswordException extends HttpException {
    name = "IncorrectPasswordException";
}

export class TransactionPinException extends HttpException {
    name = "TransactionPinException";
}

export class InvalidAgentCommissionAssignment extends HttpException {
    name = "InvalidAgentCommissionAssignment";
}

export class AgentCreationException extends HttpException {
    name = "AgentCreationException";
}
