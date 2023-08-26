import { HttpException } from "@nestjs/common";

export class NotificationNotFoundException extends HttpException {
    name: string = "NotificationNotFoundException";
}

export class InvalidNotificationTypeException extends HttpException {
    name: string = "InvalidNotificationType";
}

export class NotificationGenericException extends HttpException {
    name: string = "NotificationGenericException";
}
