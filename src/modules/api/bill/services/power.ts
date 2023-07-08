import { PrismaService } from "@/modules/core/prisma/services";
import { FormattedElectricDiscoData } from "@/modules/workflow/billPayment/interfaces";
import { IRechargeWorkflowService } from "@/modules/workflow/billPayment/providers/iRecharge/services";
import { ApiResponse, buildResponse, generateId } from "@/utils";
import { HttpStatus, Injectable } from "@nestjs/common";
import {
    BillProvider,
    PaymentChannel,
    PaymentStatus,
    Prisma,
    TransactionFlow,
    TransactionStatus,
    TransactionType,
    User,
} from "@prisma/client";
import { TransactionShortDescription } from "../../transaction";
import { PaymentProvider, PurchasePowerDto } from "../dtos";
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

    async initializePowerPurchase(options: PurchasePowerDto, user: User) {
        const provider = await this.prisma.billProvider.findUnique({
            where: { slug: options.billProvider },
        });
        if (!provider) {
            throw new BuyPowerException(
                "Bill provider does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        if (!provider.isActive) {
            throw new BuyPowerException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        switch (options.paymentProvider) {
            case PaymentProvider.PAYSTACK: {
                const reference =
                    await this.handlePowerPurchaseInitializationWithPaystack(
                        options,
                        user,
                        provider
                    );
                return buildResponse({
                    message: "payment reference successfully generated",
                    data: {
                        amount: options.amount,
                        email: user.email,
                        reference: reference,
                    },
                });
            }

            default: {
                throw new BuyPowerException(
                    `Invalid Payment Source must be one of: ${PaymentProvider.PAYSTACK}`,
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    //TODO: complete
    async handlePowerPurchaseInitializationWithPaystack(
        options: PurchasePowerDto,
        user: User,
        provider: BillProvider
    ): Promise<string> {
        const paymentReference = generateId({ type: "reference" });
        const billPaymentReference = generateId({
            type: "custom_lower_case",
            length: 12,
        });

        //TODO: compute commission for agent and merchant here

        //record transaction
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
                billPaymentReference: billPaymentReference,
                billProviderId: provider.id,
                meterType: options.meterType,
                paymentChannel: PaymentChannel.PAYSTACK_CHANNEL,
                paymentReference: paymentReference,
                paymentStatus: PaymentStatus.PENDING,
                packageType: options.discoType,
                shortDescription:
                    TransactionShortDescription.ELECTRICITY_PAYMENT,
                description: options.narration,
            };

        //iRecharge provider
        if (provider.slug == ProviderSlug.IRECHARGE) {
            const meterInfo = await this.iRechargeWorkflowService.getMeterInfo({
                discoCode: options.discoCode,
                meterNumber: options.meterNumber,
                reference: billPaymentReference,
            });
            transactionCreateOptions.serviceTransactionCode =
                meterInfo.accessToken;

            await this.prisma.transaction.create({
                data: transactionCreateOptions,
            });
        }

        //Ikeja electric
        if (provider.slug == ProviderSlug.IKEJA_ELECTRIC) {
        }

        return paymentReference;
    }
}
