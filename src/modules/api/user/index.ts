import { forwardRef, Global, Module } from "@nestjs/common";
import { AuthModule } from "../auth";
import { UserController } from "./controllers/v1";
import { UserEvent } from "./events";
import { UserService } from "./services";
import { AdminController } from "./controllers/v1/admin.controller";
import { AdminService } from "./services/admin.service";
export * from "./interfaces";
export * from "./errors";
export * from "./decorators";

@Global()
@Module({
    imports: [forwardRef(() => AuthModule)],
    controllers: [UserController, AdminController],
    providers: [UserService, UserEvent, AdminService],
    exports: [UserService, AdminService],
})
export class UserModule {}
