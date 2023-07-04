import { PrismaService } from "@/modules/core/prisma/services";
import { FormattedElectricDiscoData } from "@/modules/workflow/billPayment/interfaces";
import { IRechargeWorkflowService } from "@/modules/workflow/billPayment/providers/iRecharge/services";
import { ApiResponse, buildResponse, generateId } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    Prisma,
    TransactionFlow,
    TransactionStatus,
    TransactionType,
    User,
} from "@prisma/client";
import { PaymentSource, BuyPowerDto } from "../dtos";
import { BuyPowerException } from "../errors";
import { ProviderSlug } from "../interfaces";

@Injectable()
export class PowerBillService {
    constructor(
        private iRechargeWorkflowService: IRechargeWorkflowService,
        private prisma: PrismaService
    ) {}

    async getElectricDiscos(): Promise<ApiResponse> {
        let discos: FormattedElectricDiscoData[] = [];
        const providers = await this.prisma.billProvider.findMany({
            where: { isActive: true },
        });

        for (const provider of providers) {
            switch (provider.slug) {
                case ProviderSlug.IRECHARGE: {
                    const iRechargeDiscos =
                        await this.iRechargeWorkflowService.getElectricDiscos(
                            provider.slug
                        );
                    discos = [...discos, ...iRechargeDiscos];
                    break;
                }

                default: {
                    discos = [...discos];
                }
            }
        }

        return buildResponse({
            message: "Electric discos successfully retrieved",
            data: discos,
        });
    }

    async processBuyPowerRequest(options: BuyPowerDto, user: User) {
        console.log(user);
        switch (options.paymentSource) {
            case PaymentSource.WALLET: {
                break;
            }

            case PaymentSource.PAYSTACK: {
                break;
            }

            default: {
                throw new BuyPowerException(
                    `Invalid Payment Source must be one of: ${PaymentSource.PAYSTACK}, ${PaymentSource.WALLET}`,
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    //TODO: complete
    async handlePowerPurchaseWithPaystack(options: BuyPowerDto, user: User) {
        const transactionCreateOptions: Prisma.TransactionUncheckedCreateInput =
            {
                amount: options.amount,
                flow: TransactionFlow.OUT,
                status: TransactionStatus.PENDING,
                totalAmount: options.amount,
                transactionId: generateId({ type: "transaction" }),
                type: TransactionType.ELECTRICITY_BILL,
                userId: user.id,
                accountId: options.phone,
                billPaymentReference: generateId({
                    type: "custom_lower_case",
                    length: 12,
                }),
                // billProvider: options.provider,
            };
        console.log(transactionCreateOptions);
    }
}
