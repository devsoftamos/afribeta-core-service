import { FSDH360Bank, FSDH360BankError } from "@/libs/fsdh360Bank";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    BankDetails,
    CreateVirtualAccountOptions,
    CreateVirtualAccountResponse,
} from "../../../interfaces";
import logger from "moment-logger";
import {
    FSDH360BankException,
    FSDH360BankVirtualAccountException,
} from "../errors";
import { COMPANY_NAME } from "@/config";

@Injectable()
export class FSDH360BankService {
    constructor(private fsdh360Bank: FSDH360Bank) {}

    bankDetails: BankDetails = {
        name: "FSDH Merchant Bank",
        slug: "fsdh-merchant-bank",
    };

    async createVirtualAccount(
        options: CreateVirtualAccountOptions
    ): Promise<CreateVirtualAccountResponse> {
        try {
            const account = await this.fsdh360Bank.createStaticVirtualAccount({
                accountName: options.accountName,
                bvn: options.bvn,
            });
            return {
                accountName: `${COMPANY_NAME}-${account.accountName}`,
                accountNumber: account.accountNumber,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof FSDH360BankError: {
                    throw new FSDH360BankVirtualAccountException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new FSDH360BankException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }
}
