import { Global, Module } from "@nestjs/common";
import { EmailService } from "./services";

@Global()
@Module({
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule {}
