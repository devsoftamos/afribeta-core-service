import { Global, Module } from "@nestjs/common";
import { PermissionService } from "./services";
import { PermissionsController } from "./controllers/admin";

@Global()
@Module({
    controllers: [PermissionsController],
    providers: [PermissionService],
})
export class PermissionModule {}
