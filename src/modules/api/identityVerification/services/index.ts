import { FSDH360BankService } from "@/modules/workflow/payment/providers/fsdh360Bank/services";
import { HttpStatus, Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { BvnVerificationException } from "../errors";
import logger from "moment-logger";
import { BVNVerificationDto } from "../dtos";
import { formatName } from "@/utils";

@Injectable()
export class IdentityVerificationService {
    constructor(private fsdhBank: FSDH360BankService) {}

    async VerifyUserBVN(options: BVNVerificationDto) {
        try {
            const verifyBVN = await this.fsdhBank.verifyBVN({
                bvn: options.bvn,
            });

            logger.log(verifyBVN, "bvnVer");

            if (verifyBVN.firstName !== null) {
                if (
                    options.firstName !== formatName(verifyBVN.firstName) &&
                    options.lastName !== formatName(verifyBVN.lastName)
                ) {
                    throw new BvnVerificationException(
                        "BVN verification failed",
                        HttpStatus.NOT_ACCEPTABLE
                    );
                }
                return true;
            } else {
                throw new BvnVerificationException(
                    "BVN verification failed",
                    HttpStatus.BAD_REQUEST
                );
            }
        } catch (error) {
            logger.log(error);
        }
    }
}
