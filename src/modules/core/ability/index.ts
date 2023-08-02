import { Global, Module } from "@nestjs/common";
import { AbilityFactory } from "./services";
export * from "./definitions";

@Global()
@Module({
    providers: [AbilityFactory],
    exports: [AbilityFactory],
})
export class AbilityModule {}
