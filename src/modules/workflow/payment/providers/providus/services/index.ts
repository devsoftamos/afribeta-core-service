import { Providus, ProvidusError } from "@/libs/providus";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
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
            logger.error(error);
            switch (true) {
                case error instanceof ProvidusError: {
                    throw new providusVirtualAccountException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new ProvidusWorkflowException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }
}
