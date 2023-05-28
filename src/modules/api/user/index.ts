import { Global, Module } from "@nestjs/common";
import { UserController } from "./controllers/v1";
import { UserService } from "./services";
export * from "./interfaces";
export * from "./errors";

@Global()
@Module({
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
