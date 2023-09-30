import { forwardRef, Global, Module } from "@nestjs/common";
import { AuthModule } from "../auth";
import { UserController } from "./controllers/v1";
import { UserEvent } from "./events";
import { UserService } from "./services";
import { AdminUserController } from "./controllers/v1/admin";
export * from "./interfaces";
export * from "./errors";
export * from "./decorators";

@Global()
@Module({
    imports: [forwardRef(() => AuthModule)],
    controllers: [UserController, AdminUserController],
    providers: [UserService, UserEvent],
    exports: [UserService],
})
export class UserModule {}
