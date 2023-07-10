import { providusConfiguration } from "@/config";
import { PrismaService } from "@/modules/core/prisma/services";
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Response, NextFunction } from "express";
import { APIWebhookResponse, RequestFromProvidus } from "../interfaces";
import logger from "moment-logger";
import { VirtualAccountProvider } from "@prisma/client";

@Injectable()
export class ProvidusWebhookMiddleware implements NestMiddleware {
    constructor(private prisma: PrismaService) {}

    async use(req: RequestFromProvidus, res: Response, next: NextFunction) {
        const resBody: APIWebhookResponse = {
            requestSuccessful: true,
            responseCode: "02",
            responseMessage: "rejected transaction",
            sessionId: req.body.sessionId,
        };

        try {
            //check signature
            if (
                !req.headers["x-auth-signature"] ||
                req.headers["x-auth-signature"].toLowerCase() !=
                    providusConfiguration.authSignature.toLowerCase()
            ) {
                return res.json(resBody);
            }

            //check settlementId
            if (!req.body.settlementId || !req.body.accountNumber) {
                return res.json(resBody);
            }

            //check if the virtual account number exists
            const virtualAccount =
                await this.prisma.virtualBankAccount.findFirst({
                    where: {
                        accountNumber: req.body.accountNumber,
                        provider: VirtualAccountProvider.PROVIDUS,
                    },
                    select: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                identifier: true,
                            },
                        },
                    },
                });
            if (!virtualAccount) {
                return res.json(resBody);
            }
            req.userIdentifier = virtualAccount.user;
            return next();
        } catch (error) {
            logger.error(error);
            return res.json({
                requestSuccessful: true,
                responseCode: "03",
                responseMessage: "system failure",
                sessionId: req.body.sessionId,
            } as APIWebhookResponse);
        }
    }
}
