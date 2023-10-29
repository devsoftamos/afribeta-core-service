import { Global, Module } from "@nestjs/common";
import { RolesService } from "./services";
import { AdminRolesController } from "./controllers/admin";

@Global()
@Module({
    controllers: [AdminRolesController],
    providers: [RolesService],
})
export class RolesModule {}
