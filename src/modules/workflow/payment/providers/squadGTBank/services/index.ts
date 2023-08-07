import { FSDH360BankError } from "@/libs/fsdh360Bank";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    BankDetails,
    CreateVirtualAccountOptions,
    CreateVirtualAccountResponse,
    GTBankExtraVirtualAccountOptions,
} from "../../../interfaces";
import logger from "moment-logger";
import {
    SquadGTBankException,
    SquadGTBankVirtualAccountException,
} from "../errors";
import { SquadGTBank } from "@/libs/squadGTBank";

@Injectable()
export class SquadGTBankService {
    constructor(private squadGTBankBank: SquadGTBank) {}

    public bankDetails: BankDetails = {
        name: "Guaranty Trust Bank",
        slug: "guaranty-trust-bank",
    };

    async createVirtualAccount(
        options: CreateVirtualAccountOptions<GTBankExtraVirtualAccountOptions>
    ): Promise<CreateVirtualAccountResponse> {
        try {
            const account =
                await this.squadGTBankBank.createBusinessVirtualAccount({
                    business_name: options.accountName,
                    bvn: options.bvn,
                    customer_identifier: options.userIdentifier,
                    mobile_num: options.phone,
                });

            if (!account.data) {
                throw new SquadGTBankVirtualAccountException(
                    "Failed to create GTBank virtual account",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }

            return {
                accountName: options.accountName,
                accountNumber: account.data.virtual_account_number,
            };
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof FSDH360BankError: {
                    throw new SquadGTBankVirtualAccountException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                case error instanceof SquadGTBankVirtualAccountException: {
                    throw error;
                }

                default: {
                    throw new SquadGTBankException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }
}
