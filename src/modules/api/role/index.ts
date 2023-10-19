import { Global, Module } from "@nestjs/common";
import { RolesService } from "./services";
import { RolesController } from "./controllers";

@Global()
@Module({
    controllers: [RolesController],
    providers: [RolesService],
    exports: [RolesService],
})
export class RolesModule {}
