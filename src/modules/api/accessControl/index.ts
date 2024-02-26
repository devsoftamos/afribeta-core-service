import { Global, Module } from "@nestjs/common";
import { AdminAccessControlController } from "./controllers/admin";
import { AccessControlService } from "./services";

@Global()
@Module({
    controllers: [AdminAccessControlController],
    providers: [AccessControlService],
})
export class AccessControlModule {}
