import { PrismaService } from "@/modules/core/prisma/services";
import { PaystackService } from "@/modules/workflow/payment/providers/paystack/services";
import { PaginationMeta } from "@/utils";
import { ApiResponse, buildResponse } from "@/utils/api-response-util";
import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
    Prisma,
    User,
    UserType,
    TransactionStatus,
    TransactionType,
    WalletFundTransactionFlow,
    PaymentStatus,
} from "@prisma/client";
import { UserNotFoundException } from "../../user";
import {
    AdminTransactionHistoryDto,
    FetchRecommendedPayoutDto,
    MerchantTransactionHistoryDto,
    QueryTransactionStatus,
    TransactionHistoryDto,
    TransactionReportType,
    UpdatePayoutStatus,
    UpdatePayoutStatusDto,
    VerifyTransactionDto,
    VerifyTransactionProvider,
    ViewPayoutStatusDto,
} from "../dtos";
import {
    InvalidTransactionVerificationProvider,
    TransactionNotFoundException,
} from "../errors";
import { endOfMonth, startOfMonth } from "date-fns";

@Injectable()
export class TransactionService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => PaystackService))
        private paystackService: PaystackService
    ) {}

    async getTransactionByPaymentReference(reference: string) {
        return await this.prisma.transaction.findUnique({
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

    async transactionHistory(
        options: TransactionHistoryDto,
        user: User,
        userId?: number
    ) {
        const meta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                userId: user.id,
            },
            select: {
                id: true,
                amount: true,
                shortDescription: true,
                status: true,
                transactionId: true,
                flow: true,
                type: true,
                billService: {
                    select: {
                        icon: true,
                    },
                },
                createdAt: true,
                updatedAt: true,
            },
        };

        if (userId) {
            queryOptions.where.userId = userId;
        }

        //pagination
        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.transaction.count({
                where: queryOptions.where,
            });
            meta.totalCount = count;
            meta.page = page;
            meta.perPage = limit;
        }
        const transactions = await this.prisma.transaction.findMany(
            queryOptions
        );
        if (options.pagination) {
            meta.pageCount = transactions.length;
        }

        const result = {
            meta: meta,
            records: transactions,
        };

        return buildResponse({
            message: "Transaction history successfully retrieved",
            data: result,
        });
    }

    async viewOwnAgentTransactionHistory(
        options: TransactionHistoryDto,
        user: User,
        subAgentId: number
    ) {
        const agent = await this.prisma.user.findUnique({
            where: {
                id_createdById: {
                    id: subAgentId,
                    createdById: user.id,
                },
            },
            select: {
                createdById: true,
            },
        });

        if (!agent) {
            throw new UserNotFoundException(
                "Sub Agent could not be found",
                HttpStatus.NOT_FOUND
            );
        }

        return await this.transactionHistory(options, user, subAgentId);
    }

    async merchantTransactionHistory(options: MerchantTransactionHistoryDto) {
        const userExists = await this.prisma.user.findUnique({
            where: {
                id: +options.userId,
            },
        });

        if (!userExists || userExists.userType !== UserType.MERCHANT) {
            throw new UserNotFoundException(
                "Merchant account does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        const meta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                userId: userExists.id,
            },
            select: {
                type: true,
                amount: true,
                createdAt: true,
                billService: {
                    select: {
                        icon: true,
                    },
                },
                shortDescription: true,
                paymentStatus: true,
                provider: true,
                providerLogo: true,
            },
        };

        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.transaction.count({
                where: queryOptions.where,
            });
            meta.totalCount = count;
            meta.page = page;
            meta.perPage = limit;
        }

        const merchantTransactionHistory =
            await this.prisma.transaction.findMany(queryOptions);
        if (options.pagination) {
            meta.pageCount = merchantTransactionHistory.length;
        }

        const result = {
            meta: meta,
            records: merchantTransactionHistory,
        };

        return buildResponse({
            message: "Merchant transaction history successfully retrieved",
            data: result,
        });
    }

    async viewPayoutRequests(options: ViewPayoutStatusDto) {
        const paginationMeta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                type: TransactionType.PAYOUT,
            },
            select: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                id: true,
                amount: true,
                status: true,
                paymentReference: true,
            },
        };

        switch (options.payoutStatus) {
            case TransactionStatus.PENDING: {
                queryOptions.where.status = TransactionStatus.PENDING;
                break;
            }
            case TransactionStatus.APPROVED: {
                queryOptions.where.status = TransactionStatus.APPROVED;

                break;
            }
        }

        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.transaction.count({
                where: queryOptions.where,
            });
            paginationMeta.totalCount = count;
            paginationMeta.perPage = limit;
        }

        const transactions = await this.prisma.transaction.findMany(
            queryOptions
        );
        if (options.pagination) {
            paginationMeta.pageCount = transactions.length;
        }

        return buildResponse({
            message: "Payout history retrieved successfully",
            data: {
                meta: paginationMeta,
                records: transactions,
            },
        });
    }

    async updatePayoutStatus(options: UpdatePayoutStatusDto) {
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                id: options.id,
            },
        });

        if (!transaction) {
            throw new TransactionNotFoundException(
                "Payout request not found",
                HttpStatus.NOT_FOUND
            );
        }

        const declinePayout = async () => {
            await this.prisma.$transaction(async (tx) => {
                await tx.transaction.update({
                    data: {
                        status: UpdatePayoutStatus.DECLINED,
                    },
                    where: {
                        id: transaction.id,
                    },
                });

                await tx.wallet.update({
                    data: {
                        commissionBalance: {
                            increment: transaction.amount,
                        },
                    },
                    where: {
                        userId: transaction.userId,
                    },
                });
            });
        };

        switch (options.status) {
            case UpdatePayoutStatus.APPROVED: {
                await this.prisma.transaction.update({
                    where: {
                        id: transaction.id,
                    },
                    data: {
                        status: UpdatePayoutStatus.APPROVED,
                    },
                });
                break;
            }
            case UpdatePayoutStatus.DECLINED: {
                await declinePayout();
                break;
            }
        }

        const responseMessage =
            options.status === UpdatePayoutStatus.APPROVED
                ? "Payout request approved successfully"
                : "Payout request declined successfully";

        return buildResponse({
            message: responseMessage,
        });
    }

    async viewPayoutDetails(id: number) {
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                id: id,
            },
            select: {
                id: true,
                amount: true,
                destinationBankName: true,
                destinationBankAccountNumber: true,
                totalAmount: true,
                paymentStatus: true,
                isPayoutRecommended: true,
            },
        });

        if (!transaction) {
            throw new TransactionNotFoundException(
                "Payout request not found",
                HttpStatus.NOT_FOUND
            );
        }

        return buildResponse({
            message: "Payout request details retrieved successfully",
            data: transaction,
        });
    }

    async recommendPayout(id: number) {
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                id: id,
            },
        });

        if (!transaction) {
            throw new TransactionNotFoundException(
                "Payout request not found",
                HttpStatus.NOT_FOUND
            );
        }

        await this.prisma.transaction.update({
            where: {
                id: id,
            },
            data: {
                isPayoutRecommended: true,
            },
        });

        return buildResponse({
            message: "Payout recommended successfully",
        });
    }

    async merchantTransactionReport(
        options: TransactionHistoryDto,
        user: User
    ) {
        const paginationMeta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                userId: user.id,
            },
            select: {
                id: true,
                amount: true,
                shortDescription: true,
                paymentStatus: true,
                status: true,
                transactionId: true,
                paymentChannel: true,
                merchantCommission: true,
                commission: true,
                flow: true,
                type: true,
                createdAt: true,
            },
        };

        switch (options.type) {
            case TransactionReportType.AIRTIME_PURCHASE: {
                queryOptions.where.type =
                    TransactionReportType.AIRTIME_PURCHASE;
                break;
            }
            case TransactionReportType.CABLETV_BILL: {
                queryOptions.where.type = TransactionReportType.CABLETV_BILL;
                break;
            }
            case TransactionReportType.DATA_PURCHASE: {
                queryOptions.where.type = TransactionReportType.DATA_PURCHASE;
                break;
            }
            case TransactionReportType.ELECTRICITY_BILL: {
                queryOptions.where.type =
                    TransactionReportType.ELECTRICITY_BILL;
                break;
            }
            case TransactionReportType.PAYOUT: {
                queryOptions.where.type = TransactionReportType.PAYOUT;
                break;
            }
        }

        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.transaction.count({
                where: queryOptions.where,
            });
            paginationMeta.totalCount = count;
            paginationMeta.perPage = limit;
        }

        const transactions = await this.prisma.transaction.findMany(
            queryOptions
        );
        if (options.pagination) {
            paginationMeta.pageCount = transactions.length;
        }

        return buildResponse({
            message: "Merchant report retrieved successfully",
            data: {
                meta: paginationMeta,
                records: transactions,
            },
        });
    }

    async adminRecentTransactions(options: TransactionHistoryDto) {
        const paginationMeta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {},
            select: {
                transactionId: true,
                amount: true,
                paymentChannel: true,
                paymentStatus: true,
                flow: true,
                shortDescription: true,
                createdAt: true,
            },
        };

        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.transaction.count({
                where: queryOptions.where,
            });
            paginationMeta.totalCount = count;
            paginationMeta.perPage = limit;
        }

        const recentTransactions = await this.prisma.transaction.findMany(
            queryOptions
        );

        if (options.pagination) {
            paginationMeta.pageCount = recentTransactions.length;
        }

        return buildResponse({
            message: "Recent transactions retrieved successfully",
            data: {
                meta: paginationMeta,
                records: recentTransactions,
            },
        });
    }

    async getAllTransactions(options: AdminTransactionHistoryDto) {
        const paginationMeta: Partial<PaginationMeta> = {};

        const startDate = startOfMonth(new Date(options.date));
        const endDate = endOfMonth(new Date(options.date));

        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {},
            select: {
                id: true,
                transactionId: true,
                type: true,
                amount: true,
                paymentChannel: true,
                status: true,
                createdAt: true,
                paymentStatus: true,
            },
        };

        if (options.searchName) {
            (queryOptions.where.paymentReference = {
                search: options.searchName,
            }),
                (queryOptions.where.senderIdentifier = {
                    search: options.searchName,
                }),
                (queryOptions.where.transactionId = {
                    search: options.searchName,
                });
        }
        if (options.date) {
            queryOptions.where.createdAt = { gte: startDate, lte: endDate };
        }

        //filter bu status
        if (options.status) {
            switch (options.status) {
                case QueryTransactionStatus.SUCCESS: {
                    queryOptions.where.status = TransactionStatus.SUCCESS;
                    break;
                }
                case QueryTransactionStatus.PENDING: {
                    queryOptions.where.status = TransactionStatus.PENDING;
                    break;
                }
                case QueryTransactionStatus.FAILED: {
                    queryOptions.where.status = TransactionStatus.FAILED;
                    break;
                }
                case QueryTransactionStatus.REFUNDED: {
                    queryOptions.where.paymentStatus = PaymentStatus.REFUNDED;
                    break;
                }

                default:
                    break;
            }
        }

        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.transaction.count({
                where: queryOptions.where,
            });
            paginationMeta.totalCount = count;
            paginationMeta.perPage = limit;
            paginationMeta.page = page;
        }

        const transactions = await this.prisma.transaction.findMany(
            queryOptions
        );

        if (options.pagination) {
            paginationMeta.pageCount = transactions.length;
        }

        return buildResponse({
            message: "Transactions retrieved successfully",
            data: {
                meta: paginationMeta,
                records: transactions,
            },
        });
    }

    async adminTransactionReport(options: TransactionHistoryDto) {
        const paginationMeta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {},
            select: {
                id: true,
                amount: true,
                shortDescription: true,
                paymentStatus: true,
                status: true,
                transactionId: true,
                paymentChannel: true,
                merchantCommission: true,
                commission: true,
                flow: true,
                type: true,
                createdAt: true,
                companyCommission: true,
            },
        };

        switch (options.type) {
            case TransactionReportType.AIRTIME_PURCHASE: {
                queryOptions.where.type =
                    TransactionReportType.AIRTIME_PURCHASE;
                break;
            }
            case TransactionReportType.CABLETV_BILL: {
                queryOptions.where.type = TransactionReportType.CABLETV_BILL;
                break;
            }
            case TransactionReportType.DATA_PURCHASE: {
                queryOptions.where.type = TransactionReportType.DATA_PURCHASE;
                break;
            }
            case TransactionReportType.ELECTRICITY_BILL: {
                queryOptions.where.type =
                    TransactionReportType.ELECTRICITY_BILL;
                break;
            }
            case TransactionReportType.PAYOUT: {
                queryOptions.where.type = TransactionReportType.PAYOUT;
                break;
            }
            case TransactionReportType.COMMISSION: {
                queryOptions.where.walletFundTransactionFlow = {
                    in: [
                        WalletFundTransactionFlow.COMMISSION_BALANCE_TO_MAIN_BALANCE,
                        WalletFundTransactionFlow.FROM_PAID_COMMISSION,
                    ],
                };
            }
        }

        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.transaction.count({
                where: queryOptions.where,
            });
            paginationMeta.totalCount = count;
            paginationMeta.perPage = limit;
            paginationMeta.page = page;
        }

        const transactions = await this.prisma.transaction.findMany(
            queryOptions
        );
        if (options.pagination) {
            paginationMeta.pageCount = transactions.length;
        }

        return buildResponse({
            message: "Admin report retrieved successfully",
            data: {
                meta: paginationMeta,
                records: transactions,
            },
        });
    }

    async fetchRecommendedPayouts(options: FetchRecommendedPayoutDto) {
        const paginationMeta: Partial<PaginationMeta> = {};
        const queryOptions: Prisma.TransactionFindManyArgs = {
            where: {
                type: TransactionType.PAYOUT,
                isPayoutRecommended: true,
            },
            select: {
                id: true,
                amount: true,
                destinationBankName: true,
                destinationBankAccountNumber: true,
                totalAmount: true,
                paymentStatus: true,
                isPayoutRecommended: true,
            },
        };

        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.transaction.count({
                where: queryOptions.where,
            });
            paginationMeta.totalCount = count;
            paginationMeta.perPage = limit;
        }

        const transaction = await this.prisma.transaction.findMany(
            queryOptions
        );

        if (options.pagination) {
            paginationMeta.pageCount = transaction.length;
        }

        return buildResponse({
            message: "Recommended payouts retrieved successfully",
            data: {
                meta: paginationMeta,
                records: transaction,
            },
        });
    }

    async fetchTransactionDetails(id: number) {
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                id: id,
            },
            select: {
                type: true,
                shortDescription: true,
                senderIdentifier: true,
                amount: true,
                billServiceSlug: true,
                packageType: true,
                token: true,
                receiverIdentifier: true,
                destinationBankName: true,
                destinationBankAccountName: true,
                destinationBankAccountNumber: true,
                user: {
                    select: {
                        wallet: {
                            select: {
                                walletNumber: true,
                            },
                        },
                    },
                },
            },
        });

        if (!transaction) {
            throw new TransactionNotFoundException(
                "Transaction not found",
                HttpStatus.NOT_FOUND
            );
        }

        let response;

        switch (transaction.type) {
            case TransactionType.AIRTIME_PURCHASE: {
                response = {
                    type: transaction.type,
                    amount: transaction.amount,
                    billService: transaction.billServiceSlug,
                    serviceCharge: transaction.shortDescription,
                    phone: transaction.senderIdentifier,
                };
                break;
            }
            case TransactionType.DATA_PURCHASE: {
                response = {
                    type: transaction.type,
                    serviceCharge: transaction.shortDescription,
                    billService: transaction.billServiceSlug,
                    data: transaction.packageType,
                    phone: transaction.senderIdentifier,
                    amount: transaction.amount,
                };
                break;
            }
            case TransactionType.ELECTRICITY_BILL: {
                response = {
                    type: transaction.type,
                    serviceCharge: transaction.shortDescription,
                    billService: transaction.billServiceSlug,
                    meterNumber: transaction.senderIdentifier,
                    amount: transaction.amount,
                    token: transaction.token,
                    package: transaction.packageType,
                };
                break;
            }
            case TransactionType.CABLETV_BILL: {
                response = {
                    type: transaction.type,
                    serviceCharge: transaction.shortDescription,
                    billService: transaction.billServiceSlug,
                    amount: transaction.amount,
                    phone: transaction.receiverIdentifier,
                    package: transaction.packageType,
                    smartCardNo: transaction.senderIdentifier,
                };
                break;
            }
            case TransactionType.PAYOUT: {
                response = {
                    type: transaction.type,
                    serviceCharge: transaction.shortDescription,
                    bankName: transaction.destinationBankName,
                    accountNumber: transaction.destinationBankAccountNumber,
                    accountName: transaction.destinationBankAccountName,
                    amount: transaction.amount,
                };
                break;
            }
            case TransactionType.WALLET_FUND: {
                response = {
                    type: transaction.type,
                    serviceCharge: transaction.shortDescription,
                    amount: transaction.amount,
                    walletNumber: transaction.user.wallet.walletNumber,
                };
            }
        }

        return buildResponse({
            message: "transaction details fetched successfully",
            data: response,
        });
    }
}
