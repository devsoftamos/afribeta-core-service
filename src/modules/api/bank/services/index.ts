import { PrismaService } from "@/modules/core/prisma/services";
import { PaystackService } from "@/modules/workflow/payment/providers/paystack/services";
import { ApiResponse, buildResponse } from "@/utils/api-response-util";
import { HttpStatus, Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import {
    BankProvider,
    GetPaymentProviderBanksDto,
    ResolveBankAccountDto,
} from "../dtos";
import {
    InvalidBankProvider,
    VirtualAccountNotFoundException,
} from "../errors";

@Injectable()
export class BankService {
    constructor(
        private prisma: PrismaService,
        private paystackService: PaystackService
    ) {}

    async getBankList(
        options: GetPaymentProviderBanksDto
    ): Promise<ApiResponse> {
        switch (options.provider) {
            case BankProvider.PAYSTACK: {
                const data = await this.paystackService.getBankList();
                return buildResponse({
                    message: "Bank list successfully retrieved",
                    data: data,
                });
            }
            case BankProvider.PROVIDUS: {
                //TODO: update providus here
                const data = await this.paystackService.getBankList();
                return buildResponse({
                    message: "Bank list successfully retrieved",
                    data: data,
                });
            }

            default: {
                throw new InvalidBankProvider(
                    "Please select a valid bank provider",
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    async getVirtualBankAccount(user: User) {
        const virtualAccount = await this.prisma.virtualBankAccount.findUnique({
            where: { userId: user.id },
            select: {
                accountName: true,
                accountNumber: true,
                bankName: true,
                slug: true,
                provider: true,
            },
        });
        if (!virtualAccount) {
            throw new VirtualAccountNotFoundException(
                "Virtual account not found",
                HttpStatus.NOT_FOUND
            );
        }
        return buildResponse({
            message: "Virtual account successfully retrieved",
            data: virtualAccount,
        });
    }

    async resolveBankAccount(
        options: ResolveBankAccountDto
    ): Promise<ApiResponse> {
        switch (options.provider) {
            case BankProvider.PAYSTACK: {
                const data = await this.paystackService.resolveAccountNumber(
                    options
                );
                return buildResponse({
                    message: "Account successfully resolved",
                    data: data,
                });
            }
            case BankProvider.PROVIDUS: {
                //TODO: update providus here
                const data = await this.paystackService.resolveAccountNumber(
                    options
                );
                return buildResponse({
                    message: "Account successfully resolved",
                    data: data,
                });
            }

            default: {
                throw new InvalidBankProvider(
                    "Please select a valid bank provider",
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }
}
