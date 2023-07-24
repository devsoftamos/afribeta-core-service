import { jwtSecret, paystackSecretKey } from "@/config";
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
} from "../errors";
import {
    DataStoredInToken,
    RequestFromPaystack,
    RequestWithUser,
} from "../interfaces";
import { Observable } from "rxjs";
import { createHmac } from "crypto";

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
            switch (true) {
                case error instanceof UserNotFoundException: {
                    throw error;
                }
                case error.name == "PrismaClientKnownRequestError": {
                    throw new PrismaNetworkException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
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
