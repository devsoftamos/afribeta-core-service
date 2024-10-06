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
    CustomerTransactionHistoryDto,
    FetchRecommendedPayoutDto,
    GeneralReportDownloadDto,
    IkejaElectricReportDownloadDto,
    IkejaElectricReportDto,
    MerchantTransactionHistoryDto,
    PayoutStatus,
    QueryTransactionStatus,
    QueryTransactionType,
    TransactionHistoryDto,
    TransactionHistoryWithFiltersDto,
    TransactionReportType,
    UpdatePayoutStatus,
    UpdatePayoutStatusDto,
    UserTransactionHistoryDto,
    VerifyTransactionDto,
    VerifyTransactionProvider,
    ViewPayoutStatusDto,
} from "../dtos";
import {
    InvalidTransactionVerificationProvider,
    TransactionNotFoundException,
} from "../errors";
import {
    endOfDay,
    endOfMonth,
    format,
    startOfDay,
    startOfMonth,
} from "date-fns";
import {
    GeneralReportCSVField,
    GeneralReportDownload,
    IkejaElectricCSVField,
    IkejaElectricReport,
    IkejaElectricReportDownload,
    ReportDownloadTransactionType,
    TransactionDetailResponse,
} from "../interfaces";
import {
    BillProviderSlugForPower,
    BillServiceSlug,
    MeterType,
} from "../../bill/interfaces";
import { ikejaElectricContact } from "@/config";
import { createObjectCsvStringifier } from "csv-writer";
import { MetadataScanner } from "@nestjs/core";

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
        options: TransactionHistoryWithFiltersDto,
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

        //filters
        let type: TransactionType[] = [];
        let status: TransactionStatus[] = [];
        let paymentStatus: PaymentStatus[] = [];
        if (options.airtimeFilter) {
            type = [...type, TransactionType.AIRTIME_PURCHASE];
            queryOptions.where.type = {
                in: type,
            };
        }

        if (options.dataFilter) {
            type = [...type, TransactionType.DATA_PURCHASE];
            queryOptions.where.type = {
                in: type,
            };
        }

        if (options.internetFilter) {
            type = [...type, TransactionType.INTERNET_BILL];
            queryOptions.where.type = {
                in: type,
            };
        }

        if (options.cableTvFilter) {
            type = [...type, TransactionType.CABLETV_BILL];
            queryOptions.where.type = {
                in: type,
            };
        }

        if (options.powerFilter) {
            type = [...type, TransactionType.ELECTRICITY_BILL];
            queryOptions.where.type = {
                in: type,
            };
        }

        if (options.bankTransfer) {
            type = [...type, TransactionType.TRANSFER_FUND];
            queryOptions.where.type = {
                in: type,
            };
        }

        if (options.payoutFilter) {
            type = [...type, TransactionType.PAYOUT];
            queryOptions.where.type = {
                in: type,
            };
        }

        if (options.failedStatusFilter) {
            status = [...status, TransactionStatus.FAILED];
            queryOptions.where.status = {
                in: status,
            };
        }

        if (options.pendingStatusFilter) {
            status = [...status, TransactionStatus.PENDING];
            queryOptions.where.status = {
                in: status,
            };
        }

        if (options.successStatusFilter) {
            status = [...status, TransactionStatus.SUCCESS];
            queryOptions.where.status = {
                in: status,
            };
        }

        if (options.reversedStatusFilter) {
            paymentStatus = [...paymentStatus, PaymentStatus.REFUNDED];
            queryOptions.where.paymentStatus = {
                in: paymentStatus,
            };
        }

        if (options.walletFundFilter || options.subAgentWalletFundFilter) {
            type = [...type, TransactionType.WALLET_FUND];
            queryOptions.where.type = {
                in: type,
            };
        }

        if (options.bankTransfer) {
            type = [...type, TransactionType.TRANSFER_FUND];
            queryOptions.where.type = {
                in: type,
            };
        }

        if (options.startDate && options.endDate) {
            queryOptions.where.createdAt = {
                gte: new Date(options.startDate),
                lte: new Date(options.endDate),
            };
        }

        if (options.searchName) {
            queryOptions.where.senderIdentifier = {
                search: options.searchName,
            };
            queryOptions.where.transactionId = { search: options.searchName };
            queryOptions.where.paymentReference = {
                search: options.searchName,
            };
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
        options: TransactionHistoryWithFiltersDto,
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
                transactionId: true,
                shortDescription: true,
                paymentStatus: true,
                senderIdentifier: true,
                paymentChannel: true,
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

    async getPayouts(options: ViewPayoutStatusDto) {
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
                transactionId: true,
                isPayoutRecommended: true,
            },
        };

        switch (options.status) {
            case PayoutStatus.PENDING: {
                queryOptions.where.status = TransactionStatus.PENDING;
                queryOptions.where.isPayoutRecommended = true;
                break;
            }
            case PayoutStatus.APPROVED: {
                queryOptions.where.status = TransactionStatus.APPROVED;
                queryOptions.where.isPayoutRecommended = true;
                break;
            }

            case PayoutStatus.REQUEST: {
                //fresh request
                queryOptions.where.isPayoutRecommended = false;
                queryOptions.where.status = TransactionStatus.PENDING;
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
                        paymentStatus: PaymentStatus.REFUNDED,
                    },
                    where: {
                        id: transaction.id,
                    },
                });

                await tx.wallet.update({
                    data: {
                        commissionBalance: {
                            increment: transaction.totalAmount,
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
                        paymentStatus: PaymentStatus.SUCCESS,
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
                user: {
                    select: {
                        bankAccount: {
                            select: {
                                bankName: true,
                                accountNumber: true,
                                accountName: true,
                            },
                        },
                    },
                },
                totalAmount: true,
                status: true,
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
            where: {
                OR: [
                    {
                        walletFundTransactionFlow: null,
                    },
                    {
                        walletFundTransactionFlow: {
                            notIn: [
                                WalletFundTransactionFlow.TO_BENEFICIARY,
                                WalletFundTransactionFlow.TO_AGENT,
                            ], //from benefactor and from merchant already cover this
                        },
                    },
                ],
            },
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

        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                OR: [
                    {
                        walletFundTransactionFlow: null,
                    },
                    {
                        walletFundTransactionFlow: {
                            notIn: [
                                WalletFundTransactionFlow.TO_BENEFICIARY,
                                WalletFundTransactionFlow.TO_AGENT,
                            ], //from benefactor and merchant already cover this
                        },
                    },
                ],
            },
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
        if (options.startDate && options.endDate) {
            const startDate = new Date(options.startDate);
            const endDate = new Date(options.endDate);
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

        if (options.type) {
            switch (options.type) {
                case QueryTransactionType.AIRTIME_PURCHASE: {
                    queryOptions.where.type = TransactionType.AIRTIME_PURCHASE;
                    break;
                }

                case QueryTransactionType.DATA_PURCHASE: {
                    queryOptions.where.type = TransactionType.DATA_PURCHASE;

                    break;
                }

                case QueryTransactionType.INTERNET_BILL: {
                    queryOptions.where.type = TransactionType.INTERNET_BILL;
                    break;
                }

                case QueryTransactionType.ELECTRICITY_BILL: {
                    queryOptions.where.type = TransactionType.ELECTRICITY_BILL;
                    break;
                }

                case QueryTransactionType.CABLETV_BILL: {
                    queryOptions.where.type = TransactionType.CABLETV_BILL;

                    break;
                }
                case QueryTransactionType.TRANSFER_FUND: {
                    queryOptions.where.type = TransactionType.TRANSFER_FUND;
                    break;
                }
                case QueryTransactionType.PAYOUT: {
                    queryOptions.where.type = TransactionType.PAYOUT;

                    break;
                }
                case QueryTransactionType.WALLET_FUND: {
                    queryOptions.where.type = TransactionType.WALLET_FUND;

                    break;
                }

                case QueryTransactionType.COMMISSION: {
                    queryOptions.where.type = TransactionType.WALLET_FUND;
                    const { OR, ...rest } = queryOptions.where;
                    queryOptions.where = {
                        ...rest,
                        walletFundTransactionFlow:
                            WalletFundTransactionFlow.FROM_PAID_COMMISSION,
                    };

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

    async getDefaultAgentTransactions(
        userId: number,
        options: UserTransactionHistoryDto
    ) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                userType: true,
                isMerchantUpgradable: true,
            },
        });

        if (user.userType !== UserType.AGENT || !user.isMerchantUpgradable) {
            throw new UserNotFoundException(
                "user must be an agent",
                HttpStatus.NOT_FOUND
            );
        }
        return await this.getUserTransactions(userId, options);
    }

    async getUserTransactions(id: number, options: UserTransactionHistoryDto) {
        const paginationMeta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                userId: id,
            },
            select: {
                id: true,
                transactionId: true,
                type: true,
                amount: true,
                paymentChannel: true,
                status: true,
                createdAt: true,
                merchantId: true,
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

        const userTransactions = await this.prisma.transaction.findMany(
            queryOptions
        );

        if (options.pagination) {
            paginationMeta.pageCount = userTransactions.length;
        }

        return buildResponse({
            message: "User Transactions retrieved successfully",
            data: {
                meta: paginationMeta,
                records: userTransactions,
            },
        });
    }

    async adminTransactionReport(options: TransactionHistoryDto) {
        const paginationMeta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                OR: [
                    {
                        walletFundTransactionFlow: null,
                    },
                    {
                        walletFundTransactionFlow: {
                            notIn: [
                                WalletFundTransactionFlow.TO_BENEFICIARY,
                                WalletFundTransactionFlow.TO_AGENT,
                            ], //from benefactor and merchant already cover this
                        },
                    },
                ],
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
                transactionId: true,
                amount: true,
                billServiceSlug: true,
                packageType: true,
                token: true,
                receiverIdentifier: true,
                destinationBankName: true,
                destinationBankAccountName: true,
                destinationBankAccountNumber: true,
                walletFundTransactionFlow: true,
                meterType: true,
                updatedAt: true,
                status: true,
                senderId: true,
                userId: true,
                address: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        wallet: {
                            select: {
                                walletNumber: true,
                            },
                        },
                    },
                },
                billService: {
                    select: {
                        icon: true,
                    },
                },
                sgc: true,
                outstandingDebt: true,
                vat: true,
                remainingDebt: true,
                orgName: true,
                orgNumber: true,
                costOfUnit: true,
                fixedCharge: true,
                rate: true,
                penalty: true,
                lor: true,
                reconnectionFee: true,
                installationFee: true,
                administrativeCharge: true,
                currentCharge: true,
                meterCost: true,
                tariffName: true,
                meterAccountName: true,
                billProvider: {
                    select: {
                        slug: true,
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

        let response: TransactionDetailResponse;

        switch (transaction.type) {
            case TransactionType.AIRTIME_PURCHASE: {
                response = {
                    transactionId: transaction.transactionId,
                    type: transaction.type,
                    amount: transaction.amount,
                    shortDescription: transaction.shortDescription,
                    beneficiary: transaction.senderIdentifier,
                    date: transaction.updatedAt,
                    status: transaction.status,
                };
                break;
            }
            case TransactionType.DATA_PURCHASE: {
                response = {
                    transactionId: transaction.transactionId,
                    type: transaction.type,
                    shortDescription: transaction.shortDescription,
                    product: transaction.packageType,
                    beneficiary: transaction.senderIdentifier,
                    amount: transaction.amount,
                    date: transaction.updatedAt,
                    status: transaction.status,
                };
                break;
            }
            case TransactionType.INTERNET_BILL: {
                response = {
                    transactionId: transaction.transactionId,
                    type: transaction.type,
                    shortDescription: transaction.shortDescription,
                    product: transaction.packageType,
                    beneficiary: transaction.senderIdentifier,
                    amount: transaction.amount,
                    date: transaction.updatedAt,
                    status: transaction.status,
                };
                break;
            }
            case TransactionType.ELECTRICITY_BILL: {
                response = {
                    transactionId: transaction.transactionId,
                    type: transaction.type,
                    shortDescription: transaction.shortDescription,
                    beneficiary: transaction.senderIdentifier,
                    amount: transaction.amount,
                    token: transaction.token,
                    meterType: transaction.meterType as any,
                    date: transaction.updatedAt,
                    status: transaction.status,
                    product: transaction.packageType,
                    name: `${transaction.user?.firstName} ${transaction.user?.lastName}`,
                    email: transaction.user.email,
                    icon: transaction.billService.icon,
                    address: transaction.address,
                    beneficiaryName: transaction.meterAccountName,
                    ikejaElectric: transaction.billProvider.slug ===
                        BillProviderSlugForPower.IKEJA_ELECTRIC && {
                        sgc: transaction.sgc,
                        outstandingDebt: transaction.outstandingDebt,
                        vat: transaction.vat,
                        remainingDebt: transaction.remainingDebt,
                        orgName: transaction.orgName,
                        orgNumber: transaction.orgNumber,
                        costOfUnit: transaction.costOfUnit,
                        fixedCharge: transaction.fixedCharge,
                        rate: transaction.rate,
                        penalty: transaction.penalty,
                        lor: transaction.lor,
                        reconnectionFee: transaction.reconnectionFee,
                        installationFee: transaction.installationFee,
                        administrativeCharge: transaction.administrativeCharge,
                        currentCharge: transaction.currentCharge,
                        meterCost: transaction.meterCost,
                        tariffName: transaction.tariffName,
                        ikejaContact: {
                            email: ikejaElectricContact.email,
                            phone: ikejaElectricContact.phone,
                        },
                    },
                };
                break;
            }
            case TransactionType.CABLETV_BILL: {
                response = {
                    transactionId: transaction.transactionId,
                    type: transaction.type,
                    shortDescription: transaction.shortDescription,
                    amount: transaction.amount,
                    product: transaction.packageType,
                    beneficiary: transaction.senderIdentifier,
                    date: transaction.updatedAt,
                    status: transaction.status,
                };
                break;
            }

            case TransactionType.PAYOUT: {
                response = {
                    transactionId: transaction.transactionId,
                    type: transaction.type,
                    shortDescription: transaction.shortDescription,
                    date: transaction.updatedAt,
                    status: transaction.status,
                    amount: transaction.amount,
                    beneficiary: transaction.user
                        ? transaction.user.email
                        : "N/A",
                };
                break;
            }

            case TransactionType.TRANSFER_FUND: {
                response = {
                    transactionId: transaction.transactionId,
                    type: transaction.type,
                    shortDescription: transaction.shortDescription,
                    date: transaction.updatedAt,
                    status: transaction.status,
                    amount: transaction.amount,
                    beneficiary: transaction.destinationBankAccountName,
                    beneficiaryBank: transaction.destinationBankName,
                    beneficiaryBankAccountNumber:
                        transaction.destinationBankAccountNumber,
                };
                break;
            }
            case TransactionType.WALLET_FUND: {
                const walletToWalletTransfer = [
                    WalletFundTransactionFlow.FROM_BENEFACTOR,
                ] as any;
                if (
                    walletToWalletTransfer.includes(
                        transaction.walletFundTransactionFlow
                    )
                ) {
                    const sender = await this.prisma.user.findUnique({
                        where: { id: transaction.senderId },
                        select: {
                            email: true,
                        },
                    });
                    const receiver = await this.prisma.user.findUnique({
                        where: { id: transaction.senderId },
                        select: {
                            email: true,
                        },
                    });

                    response = {
                        transactionId: transaction.transactionId,
                        amount: transaction.amount,
                        sender: sender ? sender.email : "N/A",
                        type: "WALLET_TRANSFER",
                        shortDescription: transaction.shortDescription,
                        date: transaction.updatedAt,
                        status: transaction.status,
                        beneficiary: receiver ? receiver.email : "N/A",
                    };
                }

                if (
                    transaction.walletFundTransactionFlow ==
                    WalletFundTransactionFlow.FROM_PAID_COMMISSION
                ) {
                    response = {
                        transactionId: transaction.transactionId,
                        amount: transaction.amount,
                        type: "COMMISSION",
                        shortDescription: transaction.shortDescription,
                        date: transaction.updatedAt,
                        status: transaction.status,
                        beneficiary: transaction.user
                            ? transaction.user.email
                            : "N/A",
                    };
                }

                if (
                    transaction.walletFundTransactionFlow ==
                    WalletFundTransactionFlow.SELF_FUND
                ) {
                    response = {
                        transactionId: transaction.transactionId,
                        type: "DEPOSIT",
                        shortDescription: transaction.shortDescription,
                        amount: transaction.amount,
                        date: transaction.updatedAt,
                        status: transaction.status,
                        beneficiary: transaction.user
                            ? transaction.user.email
                            : "N/A",
                    };
                }

                if (
                    transaction.walletFundTransactionFlow ==
                    WalletFundTransactionFlow.COMMISSION_BALANCE_TO_MAIN_BALANCE
                ) {
                    //
                    response = {
                        transactionId: transaction.transactionId,
                        amount: transaction.amount,
                        type: "COMMISSION_TRANSFER",
                        shortDescription: transaction.shortDescription,
                        date: transaction.updatedAt,
                        status: transaction.status,
                        beneficiary: transaction.user
                            ? transaction.user.email
                            : "N/A",
                    };
                }

                if (
                    transaction.walletFundTransactionFlow ==
                    WalletFundTransactionFlow.FROM_FAILED_TRANSACTION
                ) {
                    response = {
                        transactionId: transaction.transactionId,
                        type: "REFUND_DEPOSIT",
                        shortDescription: transaction.shortDescription,
                        amount: transaction.amount,
                        date: transaction.updatedAt,
                        status: transaction.status,
                        beneficiary: transaction.user
                            ? transaction.user.email
                            : "N/A",
                    };
                }
            }
        }

        return buildResponse({
            message: "transaction details fetched successfully",
            data: response,
        });
    }

    async fetchCustomerTransactionHistory(
        options: CustomerTransactionHistoryDto
    ) {
        const meta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                userId: +options.userId,
            },
            select: {
                type: true,
                shortDescription: true,
                senderIdentifier: true,
                amount: true,
                transactionId: true,
                paymentChannel: true,
                token: true,
                receiverIdentifier: true,
                updatedAt: true,
                status: true,
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

        if (options.searchName) {
            queryOptions.where.senderIdentifier = {
                search: options.searchName,
            };
            queryOptions.where.transactionId = { search: options.searchName };
            queryOptions.where.paymentReference = {
                search: options.searchName,
            };
        }

        const customerTransactionHistory =
            await this.prisma.transaction.findMany(queryOptions);
        if (options.pagination) {
            meta.pageCount = customerTransactionHistory.length;
        }

        const result = {
            meta: meta,
            records: customerTransactionHistory,
        };

        return buildResponse({
            message: "Customer transaction history successfully retrieved",
            data: result,
        });
    }

    async getIkejaElectricReportDto(
        options: IkejaElectricReportDto
    ): Promise<ApiResponse<IkejaElectricReport[]>> {
        const meta: Partial<PaginationMeta> = {};
        const queryOptions: Prisma.TransactionFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                billServiceSlug: BillServiceSlug.IKEJA_ELECTRIC,
            },
            select: {
                id: true,
                transactionId: true,
                paymentStatus: true,
                status: true,
                amount: true,
                commission: true,
                merchantCommission: true,
                meterType: true,
                billService: {
                    select: {
                        name: true,
                    },
                },
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        creator: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                meterAccountName: true,
                senderIdentifier: true,
                meterAccountType: true,
                updatedAt: true,
            },
        };

        if (options.searchName) {
            queryOptions.where = {
                ...queryOptions.where,
                OR: [
                    {
                        senderIdentifier: options.searchName,
                    },
                    { transactionId: options.searchName },
                ],
            };
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
            meta.totalCount = count;
            meta.perPage = limit;
            meta.page = page;
        }

        const transactions = await this.prisma.transaction.findMany(
            queryOptions
        );

        const data: IkejaElectricReport[] = transactions.map((t: any) => {
            let agentName = `${t.user?.firstName} ${t.user?.lastName}`;
            if (t.user.creator) {
                agentName = `${t.user?.creator?.firstName} ${t.user?.creator?.lastName}`;
            }

            return {
                id: t.id,
                transactionId: t.transactionId,
                amount: t.amount,
                commission: t.commission + t.merchantCommission,
                transactionStatus: t.status,
                paymentStatus: t.paymentStatus,
                agentName: agentName,
                customerName: t.meterAccountName,
                demandType: t.meterAccountType,
                meterNumber: t.senderIdentifier,
                meterType: t.meterType,
                productName: t.billService?.name,
                date: t.updatedAt,
            };
        });

        return buildResponse({
            message: "transactions successfully retrieved",
            data: data,
        });
    }

    async downloadIkejaElectricReport(options: IkejaElectricReportDownloadDto) {
        const startDate = startOfDay(new Date(options.startDate));
        const endDate = endOfDay(new Date(options.endDate));

        const transactions = await this.prisma.transaction.findMany({
            orderBy: { createdAt: "desc" },
            where: {
                status: TransactionStatus.SUCCESS,
                billServiceSlug: BillServiceSlug.IKEJA_ELECTRIC,
                updatedAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                id: true,
                transactionId: true,
                paymentStatus: true,
                status: true,
                amount: true,
                commission: true,
                meterType: true,
                billService: {
                    select: {
                        name: true,
                    },
                },
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        creator: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
                meterAccountName: true,
                senderIdentifier: true,
                meterAccountType: true,
                updatedAt: true,
                address: true,
                billPaymentReceiptNO: true,
            },
        });

        const data: IkejaElectricReportDownload[] = transactions.map((t) => {
            let agentName = `${t.user?.firstName} ${t.user?.lastName}`;
            let agentEmail = t.user?.email;

            if (t.user.creator) {
                agentName = `${t.user?.creator?.firstName} ${t.user?.creator?.lastName}`;
                agentEmail = t.user?.creator?.email;
            }
            return {
                transactionId: t.transactionId,
                productName: t.billService.name,
                amount: t.amount,
                commission: t.commission,
                transactionStatus: t.status,
                paymentStatus: t.paymentStatus,
                meterNumber: t.senderIdentifier,
                meterType: t.meterType as MeterType,
                demandType: t.meterAccountType,
                agentName: agentName,
                agentEmail: agentEmail,
                receiptNo: t.billPaymentReceiptNO,
                customerName: t.meterAccountName || "N/A",
                customerAddress: t.address || "N/A",
                date: format(t.updatedAt, "yyyy-MM-dd HH:mm:ss"),
            };
        });

        return this.generateIkejaElectricCsv(data);
    }

    private generateIkejaElectricCsv(dbData: IkejaElectricReportDownload[]) {
        const csvHeader: IkejaElectricCSVField[] = [
            { id: "transactionId", title: "Transaction ID" },
            { id: "productName", title: "Product" },
            { id: "amount", title: "Amount" },
            { id: "commission", title: "Commission" },
            { id: "transactionStatus", title: "Transaction Status" },
            { id: "paymentStatus", title: "Payment Status" },
            { id: "meterNumber", title: "Account/Meter Number" },
            { id: "meterType", title: "Meter Type" },
            { id: "demandType", title: "Demand Type" },
            { id: "agentName", title: "Agent Name" },
            { id: "agentEmail", title: "Agent Email" },
            { id: "receiptNo", title: "Receipt No" },
            { id: "customerName", title: "Customer Name" },
            { id: "customerAddress", title: "Customer Address" },
            { id: "date", title: "Date" },
        ];

        const csvStringifier = createObjectCsvStringifier({
            header: csvHeader,
        });

        return (
            csvStringifier.getHeaderString() +
            csvStringifier.stringifyRecords(dbData)
        );
    }

    private buildGeneralReportCsv(dbData: GeneralReportDownload[]) {
        const csvHeader: GeneralReportCSVField[] = [
            { id: "transactionId", title: "Transaction ID" },
            { id: "transactionType", title: "Transaction Type" },
            { id: "productName", title: "Product" },
            { id: "amount", title: "Amount" },
            { id: "commission", title: "Commission" },
            { id: "afribCommission", title: "Afrib Commission" },
            { id: "transactionStatus", title: "Transaction Status" },
            { id: "paymentStatus", title: "Payment Status" },
            { id: "serviceCharge", title: "Service Charge" },
            { id: "name", title: "User Name" },
            { id: "email", title: "User Email" },
            { id: "userType", title: "User Type" },
            { id: "paymentChannel", title: "Payment Channel" },
            { id: "date", title: "Date" },
        ];

        const csvStringifier = createObjectCsvStringifier({
            header: csvHeader,
        });

        return (
            csvStringifier.getHeaderString() +
            csvStringifier.stringifyRecords(dbData)
        );
    }

    async downloadGeneralReport(options: GeneralReportDownloadDto) {
        const startDate = startOfDay(new Date(options.startDate));
        const endDate = endOfDay(new Date(options.endDate));

        const transactions = await this.prisma.transaction.findMany({
            orderBy: { createdAt: "desc" },
            where: {
                updatedAt: {
                    gte: startDate,
                    lte: endDate,
                },
                OR: [
                    {
                        walletFundTransactionFlow: null,
                    },
                    {
                        walletFundTransactionFlow: {
                            notIn: [
                                WalletFundTransactionFlow.TO_BENEFICIARY,
                                WalletFundTransactionFlow.TO_AGENT,
                            ], //from benefactor and from merchant already cover this
                        },
                    },
                ],
            },
            select: {
                id: true,
                transactionId: true,
                paymentStatus: true,
                status: true,
                amount: true,
                commission: true,
                serviceCharge: true,
                companyCommission: true,
                paymentChannel: true,
                walletFundTransactionFlow: true,
                merchantCommission: true,
                billService: {
                    select: {
                        name: true,
                    },
                },
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        userType: true,
                        creator: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                userType: true,
                            },
                        },
                    },
                },
                type: true,
                updatedAt: true,
                address: true,
            },
        });

        const data: GeneralReportDownload[] = transactions.map((t) => {
            let name = `${t.user?.firstName} ${t.user?.lastName}`;
            let email = t.user?.email;
            let userType = t.user.userType;
            let type: ReportDownloadTransactionType = t.type;

            if (t.user.creator) {
                name = `${t.user?.creator?.firstName} ${t.user?.creator?.lastName}`;
                email = t.user?.creator?.email;
                userType = t.user?.creator?.userType;
            }

            if (t.type == TransactionType.WALLET_FUND) {
                switch (t.walletFundTransactionFlow) {
                    case WalletFundTransactionFlow.COMMISSION_BALANCE_TO_MAIN_BALANCE: {
                        type = "WALLET_COMMISSION_TRANSFER";
                        break;
                    }
                    case WalletFundTransactionFlow.FROM_BENEFACTOR: {
                        type = "INTRA_WALLET_TRANSFER";
                        break;
                    }

                    case WalletFundTransactionFlow.FROM_FAILED_TRANSACTION: {
                        type = "REFUND_DEPOSIT";
                        break;
                    }
                    case WalletFundTransactionFlow.FROM_MERCHANT: {
                        type = "INTRA_WALLET_TRANSFER";
                        break;
                    }
                    case WalletFundTransactionFlow.FROM_PAID_COMMISSION: {
                        type = "COMMISSION_DEPOSIT";
                        break;
                    }
                    case WalletFundTransactionFlow.SELF_FUND: {
                        type = "WALLET_FUND_BANK_DEPOSIT";
                        break;
                    }
                }
            }

            if (t.type == TransactionType.TRANSFER_FUND) {
                type = "WALLET_WITHDRAWAL";
            }
            const data: GeneralReportDownload = {
                transactionId: t.transactionId,
                productName: t.billService?.name || "N/A",
                amount: t.amount,
                commission: t.commission + t.merchantCommission,
                transactionStatus: t.status,
                paymentStatus: t.paymentStatus,
                userType: userType,
                transactionType: type,
                serviceCharge: t.serviceCharge,
                name: name,
                email: email,
                afribCommission: t.companyCommission,
                paymentChannel: t.paymentChannel || ("N/A" as any),
                date: format(t.updatedAt, "yyyy-MM-dd HH:mm:ss"),
            };
            return data;
        });

        return this.buildGeneralReportCsv(data);
    }
}
