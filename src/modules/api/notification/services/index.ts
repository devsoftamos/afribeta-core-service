import { PrismaService } from "@/modules/core/prisma/services";
import { ApiResponse, buildResponse, PaginationMeta } from "@/utils";
import { Injectable } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { ListNotificationDto } from "../dtos";

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) {}

    async getNotifications(
        options: ListNotificationDto,
        user: User
    ): Promise<ApiResponse> {
        const meta: Partial<PaginationMeta> = {};
        const queryOptions: Prisma.NotificationFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                userId: user.id,
            },
        };

        if (options.pagination) {
            const page = +options.page ?? 1;
            const limit = +options.limit ?? 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.notification.count({
                where: queryOptions.where,
            });
            meta.totalCount = count;
            meta.page = page;
            meta.perPage = limit;
        }

        const notifications = await this.prisma.notification.findMany(
            queryOptions
        );
        if (options.pagination) {
            meta.pageCount = notifications.length;
        }

        return buildResponse({
            message: "Notifications successfully retrieved",
            data: {
                meta: meta,
                records: notifications,
            },
        });
    }
}
