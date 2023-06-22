import { PrismaService } from "@/modules/core/prisma/services";
import { PaystackService } from "@/modules/workflow/payment/services/paystack";
import { ApiResponse, buildResponse } from "@/utils/api-response-util";
import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { customAlphabet } from "nanoid";
import { VerifyTransactionDto, VerifyTransactionProvider } from "../dtos";
import { InvalidTransactionVerificationProvider } from "../errors";
import { TransactionIdOption } from "../interfaces";

@Injectable()
export class TransactionService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => PaystackService))
        private paystackService: PaystackService
    ) {}

    generateId(option: TransactionIdOption) {
        const length = option.type == "reference" ? 20 : 15;
        return customAlphabet("1234567890ABCDEFGH", length)();
    }

    async getTransactionByPaymentReference(reference: string) {
        return await this.prisma.transaction.findFirst({
            where: { paymentReference: reference },
        });
    }

    async verifyTransaction(
        options: VerifyTransactionDto
    ): Promise<ApiResponse> {
        switch (options.provider) {
            case VerifyTransactionProvider.PAYSTACK: {
                const transaction =
                    await this.paystackService.verifyTransaction(
                        options.reference
                    );
                return buildResponse({
                    message: "transaction status verified",
                    data: {
                        transactionStatus: transaction.status,
                    },
                });
            }
            default: {
                throw new InvalidTransactionVerificationProvider(
                    "Invalid transaction verification provider",
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }
}