import { PrismaService } from "@/modules/core/prisma/services";
import { PaystackService } from "@/modules/workflow/payment/providers/paystack/services";
import { ApiResponse, buildResponse } from "@/utils/api-response-util";
import { HttpStatus, Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { BankProvider, CreateBankDto, ResolveBankAccountDto } from "../dtos";
import { DuplicateBankAccountException, InvalidBankProvider } from "../errors";

@Injectable()
export class BankService {
    constructor(
        private prisma: PrismaService,
        private paystackService: PaystackService
    ) {}

    async getBankList(): Promise<ApiResponse> {
        const banks = await this.prisma.bank.findMany({
            select: {
                name: true,
                code: true,
                logo: true,
            },
        });
        return buildResponse({
            message: "Bank list successfully retrieved",
            data: banks,
        });
    }

    async getVirtualBankAccounts(user: User): Promise<ApiResponse> {
        const virtualAccounts = await this.prisma.virtualBankAccount.findMany({
            where: { userId: user.id },
            select: {
                accountName: true,
                accountNumber: true,
                bankName: true,
                slug: true,
                provider: true,
            },
        });

        return buildResponse({
            message: "Virtual accounts successfully retrieved",
            data: virtualAccounts,
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

    async createBank(options: CreateBankDto, user: User) {
        const bank = await this.prisma.bankAccount.findUnique({
            where: {
                userId_accountNumber_bankCode: {
                    userId: user.id,
                    accountNumber: options.accountNumber,
                    bankCode: options.bankCode,
                },
            },
        });
        if (bank) {
            throw new DuplicateBankAccountException(
                "Bank account already exist",
                HttpStatus.BAD_REQUEST
            );
        }

        const createdBank = await this.prisma.bankAccount.create({
            data: {
                accountName: options.accountName,
                accountNumber: options.accountNumber,
                bankCode: options.bankCode,
                bankName: options.bankName,
                userId: user.id,
            },
        });

        return buildResponse({
            message: "Bank details successfully saved",
            data: createdBank,
        });
    }
}
