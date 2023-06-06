import { PaystackService } from "@/modules/workflow/payment/services/paystack";
import { buildResponse } from "@/utils/api-response-util";
import { HttpStatus, Injectable } from "@nestjs/common";
import { BankProvider, GetPaymentProviderBanksDto } from "../dtos";
import { InvalidBankProvider } from "../errors";

@Injectable()
export class BankService {
    constructor(
        //private prisma: PrismaService,
        private paystackService: PaystackService
    ) {}

    async getBankList(options: GetPaymentProviderBanksDto) {
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
}
