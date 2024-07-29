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
import { SquadGTBank, SquadGtBankError } from "@/libs/squadGTBank";
import { COMPANY_NAME } from "@/config";

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
                    HttpStatus.BAD_REQUEST
                );
            }

            return {
                accountName: `${account.data.first_name} ${account.data.last_name}`,
                accountNumber: account.data.virtual_account_number,
            };
        } catch (error) {
            logger.error(error, "****VIRTUAL ACCOUNT****** SQUAD");
            switch (true) {
                case error instanceof SquadGtBankError: {
                    throw new SquadGTBankVirtualAccountException(
                        error.message,
                        HttpStatus.BAD_REQUEST
                    );
                }

                case error instanceof SquadGTBankVirtualAccountException: {
                    throw error;
                }

                default: {
                    throw new SquadGTBankException(
                        error.message,
                        HttpStatus.BAD_REQUEST
                    );
                }
            }
        }
    }
}
