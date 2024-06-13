import { FSDH360BankService } from "@/modules/workflow/payment/providers/fsdh360Bank/services";
import { Injectable } from "@nestjs/common";
import { BVNVerificationDto } from "../dtos";

@Injectable()
export class IdentityVerificationService {
    constructor(private fsdhBankService: FSDH360BankService) {}

    async verifyUserBVN(options: BVNVerificationDto) {
        await this.fsdhBankService.verifyBVN({
            bvn: options.bvn,
        });

        //****************DISABLE STRICT CHECK************************ */
        // if (
        //     options.firstName !== formatName(verifyBVN.firstName) &&
        //     options.lastName !== formatName(verifyBVN.lastName)
        // ) {
        //     throw new BvnVerificationException(
        //         "BVN verification failed. The provided first name and last name did not match with the BVN name",
        //         HttpStatus.NOT_ACCEPTABLE
        //     );
        // }
    }
}
