import { PrismaService } from "@/modules/core/prisma/services";
import { Injectable } from "@nestjs/common";
import { customAlphabet } from "nanoid";
import { TransactionIdOption } from "../interfaces";

@Injectable()
export class TransactionService {
    constructor(private prisma: PrismaService) {}

    generateId(option: TransactionIdOption) {
        const length = option.type == "reference" ? 20 : 15;
        return customAlphabet("1234567890ABCDEFGH", length)();
    }

    async getTransactionByPaymentReference(reference: string) {
        return await this.prisma.transaction.findFirst({
            where: { paymentReference: reference },
        });
    }
}
