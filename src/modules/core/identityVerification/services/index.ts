import { FSDH360BankService } from "@/modules/workflow/payment/providers/fsdh360Bank/services";
import { HttpStatus, Injectable } from "@nestjs/common";
import { BvnVerificationException } from "../errors";
import { BVNVerificationDto } from "../dtos";
import { formatName } from "@/utils";

@Injectable()
export class IdentityVerificationService {
    constructor(private fsdhBank: FSDH360BankService) {}

    async verifyUserBVN(options: BVNVerificationDto) {
        const verifyBVN = await this.fsdhBank.verifyBVN({
            bvn: options.bvn,
        });

        if (!(verifyBVN.firstName && verifyBVN.lastName)) {
            throw new BvnVerificationException(
                "BVN verification failed",
                HttpStatus.BAD_REQUEST
            );
        }

        if (
            options.firstName !== formatName(verifyBVN.firstName) &&
            options.lastName !== formatName(verifyBVN.lastName)
        ) {
            throw new BvnVerificationException(
                "BVN verification failed. The provided first name and last name did not match with the BVN name",
                HttpStatus.NOT_ACCEPTABLE
            );
        }
    }
}
