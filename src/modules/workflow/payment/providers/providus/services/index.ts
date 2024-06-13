import { Providus, ProvidusError } from "@/libs/providus";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    BankDetails,
    CreateVirtualAccountOptions,
    CreateVirtualAccountResponse,
} from "../../../interfaces";
import logger from "moment-logger";
import {
    providusVirtualAccountException,
    ProvidusWorkflowException,
} from "../errors";

@Injectable()
export class ProvidusService {
    constructor(private providus: Providus) {}

    public bankDetails: BankDetails = {
        name: "Providus Bank Plc",
        slug: "providus-bank-plc",
    };

    async createVirtualAccount(
        options: CreateVirtualAccountOptions
    ): Promise<CreateVirtualAccountResponse> {
        try {
            const account = await this.providus.createReservedVirtualAccount({
                account_name: options.accountName,
                bvn: options.bvn ?? "",
            });
            return {
                accountName: account.account_name,
                accountNumber: account.account_number,
            };
        } catch (error) {
            console.error(error, "- providus bank");
            switch (true) {
                case error instanceof ProvidusError: {
                    throw new providusVirtualAccountException(
                        error.message,
                        HttpStatus.BAD_REQUEST
                    );
                }

                default: {
                    throw new ProvidusWorkflowException(
                        error.message,
                        HttpStatus.BAD_REQUEST
                    );
                }
            }
        }
    }
}
