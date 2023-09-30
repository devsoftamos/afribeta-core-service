import { PrismaService } from "@/modules/core/prisma/services";
import {
    CanActivate,
    ExecutionContext,
    HttpStatus,
    Injectable,
} from "@nestjs/common";
import { UserType } from "@prisma/client";
import { RequestWithUser } from "../../auth";
import { WalletNotFoundException } from "../../wallet";

@Injectable()
export class InitializeBillPaymentGuard implements CanActivate {
    constructor(private prisma: PrismaService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest() as RequestWithUser;
        if (
            req.user.userType == UserType.AGENT ||
            req.user.userType == UserType.MERCHANT
        ) {
            const wallet = await this.prisma.wallet.findUnique({
                where: {
                    userId: req.user.id,
                },
            });

            if (!wallet) {
                throw new WalletNotFoundException(
                    "Afribeta Wallet is required for the account type. kindly submit your KYC in order to setup your Wallet",
                    HttpStatus.NOT_FOUND
                );
            }
            return true;
        }
        return true;
    }
}
