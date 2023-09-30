import { HttpException } from "@nestjs/common";

export class NotificationNotFoundException extends HttpException {
    name = "NotificationNotFoundException";
}

export class InvalidNotificationTypeException extends HttpException {
    name = "InvalidNotificationType";
}

export class NotificationGenericException extends HttpException {
    name = "NotificationGenericException";
}
