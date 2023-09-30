import { AuthGuard } from "@/modules/api/auth/guard";
import { User as UserModel } from "@prisma/client";

import {
    Controller,
    Get,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { ListNotificationDto } from "../../dtos";
import { NotificationService } from "../../services";
import { User } from "@/modules/api/user";

@UseGuards(AuthGuard)
@Controller({
    path: "notification",
})
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @Get()
    async getNotifications(
        @Query(ValidationPipe) listNotificationDto: ListNotificationDto,
        @User() user: UserModel
    ) {
        return await this.notificationService.getNotifications(
            listNotificationDto,
            user
        );
    }
}
