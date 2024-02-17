import { Global, Module } from "@nestjs/common";
import { IdentityVerificationService } from "./services";

@Global()
@Module({
    providers: [IdentityVerificationService],
    exports: [IdentityVerificationService],
})
export class IdentityVerificationModule {}
