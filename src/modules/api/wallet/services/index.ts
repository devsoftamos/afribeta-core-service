import {
    AssignDynamicVirtualAccountWithValidationOptions,
    PaystackError,
} from "@/libs/paystack";
import { PrismaService } from "@/modules/core/prisma/services";
import { PaystackService } from "@/modules/workflow/payment/services/paystack";
import { HttpStatus, Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import {
    DuplicateUserException,
    UserNotFoundException,
} from "@/modules/api/user";
import { UserService } from "@/modules/api/user/services";
import { InitiateWalletCreationDto } from "../dto";
import {
    WalletCreationException,
    WalletCreationPaystackException,
    DuplicateWalletException,
} from "../errors";
import { CreateWalletAccount } from "../interfaces";
import logger from "moment-logger";
import { buildResponse } from "@/utils/api-response-util";
import { isProduction } from "@/config";

@Injectable()
export class WalletService {
    constructor(
        private prisma: PrismaService,
        private paystackService: PaystackService,
        private userService: UserService
    ) {}

    async createUserWalletAndVirtualAccount(options: CreateWalletAccount) {
        try {
            const user = await this.userService.findUserByEmail(options.email);
            if (!user) {
                logger.error(
                    new UserNotFoundException(
                        "Could not find user to create wallet and virtual account",
                        HttpStatus.NOT_FOUND
                    )
                );
                return false;
            }
            const wallet = await this.prisma.wallet.findUnique({
                where: { userId: user.id },
            });

            if (wallet) {
                logger.error(
                    new DuplicateWalletException(
                        `Wallet already exists for user ${user.email}`,
                        HttpStatus.BAD_REQUEST
                    )
                );
                return false;
            }

            //create record
            await this.prisma.$transaction(async (tx) => {
                await tx.wallet.create({
                    data: { userId: user.id },
                });

                await tx.virtualBankAccount.create({
                    data: {
                        accountName: options.accountName,
                        accountNumber: options.accountNumber,
                        bankName: options.bankName,
                        provider: options.provider,
                        userId: user.id,
                        customerCode: options.customerCode,
                        slug: options.providerBankSlug,
                    },
                });
            });
        } catch (error) {
            logger.error(error);
        }
    }

    async initiateCustomerWalletCreation(
        options: InitiateWalletCreationDto,
        user: User
    ) {
        try {
            const wallet = await this.prisma.wallet.findUnique({
                where: { userId: user.id },
            });

            if (user.userType !== "customer") {
                throw new WalletCreationException(
                    "User must be of customer type",
                    HttpStatus.BAD_REQUEST
                );
            }

            if (wallet) {
                throw new DuplicateWalletException(
                    "Wallet already exists",
                    HttpStatus.BAD_REQUEST
                );
            }

            const testData = {
                country: "NG",
                type: "bank_account",
                account_number: "0111111111",
                bvn: "22222222222",
                bank_code: "007",
                first_name: "Uchenna",
                last_name: "Okoro",
                email: "uche@example.com",
            };

            const paystackDynamicVirtualAccountCreationOptions: AssignDynamicVirtualAccountWithValidationOptions =
                {
                    bvn: options.bvn,
                    account_number: options.accountNumber,
                    bank_code: options.bankCode,
                    country: "NG",
                    email: user.email,
                    first_name: user.firstName,
                    last_name: user.lastName,
                    phone: `+234${user.phone.substring(1)}`,
                    preferred_bank: "wema-bank",
                };

            const data = isProduction
                ? paystackDynamicVirtualAccountCreationOptions
                : testData;

            await this.paystackService.assignDynamicValidatedVirtualAccount(
                data as any
            );
            return buildResponse({
                message:
                    "Your Afribeta wallet would be created after we have successfully verified your bank details",
            });
        } catch (error) {
            switch (true) {
                case error instanceof DuplicateUserException: {
                    throw error;
                }

                case error instanceof WalletCreationException: {
                    throw error;
                }

                case error instanceof PaystackError: {
                    throw new WalletCreationPaystackException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw error;
                }
            }
        }
    }
}
