import { Module } from "@nestjs/common";
import { NotificationController } from "./controllers/v1";
import { NotificationService } from "./services";
export * from "./errors";

@Module({
    controllers: [NotificationController],
    providers: [NotificationService],
})
export class NotificationModule {}
