import {
    fsdh360ApiKeyAuth,
    fsdh360Ips,
    jwtSecret,
    paystackSecretKey,
    squadGtBankOptions,
} from "@/config";
import {
    CanActivate,
    ExecutionContext,
    HttpStatus,
    Injectable,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { UserNotFoundException } from "@/modules/api/user";
import { UserService } from "../../user/services";
import {
    AuthTokenValidationException,
    InvalidAuthTokenException,
    PrismaNetworkException,
    UserUnauthorizedException,
} from "../errors";
import {
    DataStoredInToken,
    RequestFromFSDH360Bank,
    RequestFromPaystack,
    RequestFromSquadGTBank,
    RequestWithUser,
} from "../interfaces";
import { Observable } from "rxjs";
import { createHmac } from "crypto";
import logger from "moment-logger";
import { Status } from "@prisma/client";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private userService: UserService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest() as RequestWithUser;
        const token = this.extractTokenFromHeader(request);
        if (!token) {
            throw new InvalidAuthTokenException(
                "Authorization header is missing",
                HttpStatus.UNAUTHORIZED
            );
        }
        try {
            const payload: DataStoredInToken =
                await this.jwtService.verifyAsync(token, {
                    secret: jwtSecret,
                });
            const user = await this.userService.findUserByIdentifier(
                payload.sub
            );
            if (!user) {
                throw new UserNotFoundException(
                    "Your session is unauthorized",
                    HttpStatus.UNAUTHORIZED
                );
            }
            request.user = user;
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof UserNotFoundException: {
                    throw error;
                }
                case error.name == "PrismaClientKnownRequestError": {
                    throw new PrismaNetworkException(
                        "Unable to process request. Please try again",
                        HttpStatus.SERVICE_UNAVAILABLE
                    );
                }

                default: {
                    throw new AuthTokenValidationException(
                        "Your session is unauthorized or expired",
                        HttpStatus.UNAUTHORIZED
                    );
                }
            }
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(" ") ?? [];
        return type === "Bearer" ? token : undefined;
    }
}

@Injectable()
export class IsEnabledGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user && user.status === Status.ENABLED) {
            return true;
        }
        throw new UserUnauthorizedException(
            "User account is disabled",
            HttpStatus.UNAUTHORIZED
        );
    }
}

@Injectable()
export class PaystackWebhookGuard implements CanActivate {
    canActivate(
        context: ExecutionContext
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context
            .switchToHttp()
            .getRequest() as RequestFromPaystack;

        const hash = createHmac("sha512", paystackSecretKey)
            .update(JSON.stringify(request.body))
            .digest("hex");

        if (hash == request.headers["x-paystack-signature"]) {
            return true;
        } else {
            return false;
        }
    }
}

@Injectable()
export class SquadGTBankWebhookGuard implements CanActivate {
    canActivate(
        context: ExecutionContext
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context
            .switchToHttp()
            .getRequest() as RequestFromSquadGTBank;

        const hash = createHmac("sha512", squadGtBankOptions.secretKey)
            .update(JSON.stringify(request.body))
            .digest("hex");

        if (hash == request.headers["x-squad-signature"]) {
            return true;
        } else {
            return false;
        }
    }
}

@Injectable()
export class FSDH360BankWebhookGuard implements CanActivate {
    canActivate(
        context: ExecutionContext
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context
            .switchToHttp()
            .getRequest() as RequestFromFSDH360Bank;

        if (
            fsdh360ApiKeyAuth == request.headers["api-key-auth"] &&
            fsdh360Ips.includes(request.ip)
        ) {
            return true;
        } else {
            return false;
        }
    }
}
