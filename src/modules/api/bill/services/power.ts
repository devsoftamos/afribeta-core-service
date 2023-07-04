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

@Injectable()
export class PowerBillService {
    constructor(private iRechargeWorkflowService: IRechargeWorkflowService) {}

    async getElectricDiscos(): Promise<ApiResponse> {
        const discos = await this.iRechargeWorkflowService.getElectricDiscos();

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
