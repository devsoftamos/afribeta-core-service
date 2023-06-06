import { forwardRef, Global, Module } from "@nestjs/common";
import { AuthModule } from "../auth";
import { UserController } from "./controllers/v1";
import { UserService } from "./services";
export * from "./interfaces";
export * from "./errors";
export * from "./decorators";

@Global()
@Module({
    imports: [forwardRef(() => AuthModule)],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
