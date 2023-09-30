import { PrismaService } from "@/modules/core/prisma/services";
import {
    GetDataBundleResponse,
    NetworkDataProvider,
} from "@/modules/workflow/billPayment";
import { IRechargeWorkflowService } from "@/modules/workflow/billPayment/providers/iRecharge/services";
import { ApiResponse, buildResponse, generateId } from "@/utils";
import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
    PaymentChannel,
    PaymentStatus,
    Prisma,
    TransactionFlow,
    TransactionStatus,
    TransactionType,
    User,
} from "@prisma/client";
import {
    TransactionNotFoundException,
    TransactionShortDescription,
} from "../../transaction";
import { UserNotFoundException } from "../../user";
import {
    InsufficientWalletBalanceException,
    WalletNotFoundException,
} from "../../wallet";
import { PaymentProvider, PaymentReferenceDto } from "../dtos";
import { GetDataBundleDto, PurchaseDataDto } from "../dtos/data";
import {
    BillProviderNotFoundException,
    DataPurchaseException,
    DuplicateDataPurchaseException,
    PowerPurchaseException,
    InvalidBillTypePaymentReference,
    WalletChargeException,
    InvalidBillProviderException,
} from "../errors";
import {
    BillProviderSlug,
    BillPurchaseInitializationHandlerOptions,
    CompleteBillPurchaseOptions,
    CompleteBillPurchaseUserOptions,
    ProcessBillPaymentOptions,
    VerifyPurchase,
} from "../interfaces";
import {
    DataPurchaseInitializationHandlerOutput,
    CompleteDataPurchaseTransactionOptions,
    CompleteDataPurchaseOutput,
    FormatDataBundleNetworkInput,
    FormatDataBundleNetworkOutput,
    VerifyDataPurchaseData,
} from "../interfaces/data";
import logger from "moment-logger";
import { DB_TRANSACTION_TIMEOUT } from "@/config";
import { BillService } from ".";
import { IRechargeVendDataException } from "@/modules/workflow/billPayment/providers/iRecharge";
import { BillEvent } from "../events";

@Injectable()
export class DataBillService {
    constructor(
        private iRechargeWorkflowService: IRechargeWorkflowService,
        private prisma: PrismaService,

        @Inject(forwardRef(() => BillService))
        private billService: BillService,
        private billEvent: BillEvent
    ) {}

    async getDataBundles(options: GetDataBundleDto): Promise<ApiResponse> {
        let dataBundles: GetDataBundleResponse[] = [];
        let billProvider = await this.prisma.billProvider.findFirst({
            where: {
                isActive: true,
                isDefault: true,
            },
        });
        if (!billProvider) {
            billProvider = await this.prisma.billProvider.findFirst({
                where: {
                    isActive: true,
                },
            });
        }

        if (billProvider) {
            switch (billProvider.slug) {
                case BillProviderSlug.IRECHARGE: {
                    const iRechargeDataBundles =
                        await this.iRechargeWorkflowService.getDataBundles(
                            options.billService
                        );
                    dataBundles = [...dataBundles, ...iRechargeDataBundles];
                    break;
                }

                default: {
                    throw new InvalidBillProviderException(
                        "No integration for the retrieved bill provider",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }

        return buildResponse({
            message: "Successfully retrieved data bundles",
            data: {
                billProvider: billProvider.slug,
                billService: options.billService,
                bundles: dataBundles,
            },
        });
    }

    async initializeDataPurchase(
        options: PurchaseDataDto,
        user: User
    ): Promise<ApiResponse> {
        const billProvider = await this.prisma.billProvider.findUnique({
            where: {
                slug: options.billProvider,
            },
        });

        if (!billProvider) {
            throw new DataPurchaseException(
                "Bill provider does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        if (!billProvider.isActive) {
            throw new DataPurchaseException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        const providerNetwork =
            await this.prisma.billProviderDataBundleNetwork.findUnique({
                where: {
                    billServiceSlug_billProviderSlug: {
                        billProviderSlug: options.billProvider,
                        billServiceSlug: options.billService,
                    },
                },
            });

        if (!providerNetwork) {
            throw new DataPurchaseException(
                "The network provider is not associated with the bill provider",
                HttpStatus.BAD_REQUEST
            );
        }

        const response = (resp: DataPurchaseInitializationHandlerOutput) => {
            return buildResponse({
                message: "Data purchase payment successfully initialized",
                data: {
                    amount: options.price,
                    email: user.email,
                    reference: resp.paymentReference,
                },
            });
        };

        switch (options.paymentProvider) {
            case PaymentProvider.PAYSTACK: {
                const resp = await this.handleDataPurchaseInitialization({
                    billProvider: billProvider,
                    purchaseOptions: options,
                    user: user,
                    paymentChannel: PaymentChannel.PAYSTACK_CHANNEL,
                });
                return response(resp);
            }
            case PaymentProvider.WALLET: {
                const wallet = await this.prisma.wallet.findUnique({
                    where: {
                        userId: user.id,
                    },
                });

                if (!wallet) {
                    throw new WalletNotFoundException(
                        "Wallet does not exist. Kindly setup your KYC",
                        HttpStatus.NOT_FOUND
                    );
                }
                if (wallet.mainBalance < options.price) {
                    throw new InsufficientWalletBalanceException(
                        "Insufficient wallet balance",
                        HttpStatus.BAD_REQUEST
                    );
                }
                const resp = await this.handleDataPurchaseInitialization({
                    billProvider: billProvider,
                    paymentChannel: PaymentChannel.WALLET,
                    purchaseOptions: options,
                    user: user,
                    wallet: wallet,
                });
                return response(resp);
            }

            default: {
                throw new PowerPurchaseException(
                    `Payment provider must be one of: ${PaymentProvider.PAYSTACK}, ${PaymentProvider.WALLET}`,
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    async handleDataPurchaseInitialization(
        options: BillPurchaseInitializationHandlerOptions<PurchaseDataDto>
    ): Promise<DataPurchaseInitializationHandlerOutput> {
        const paymentReference = generateId({ type: "reference" });
        const billPaymentReference = generateId({
            type: "numeric",
            length: 12,
        });
        const { billProvider, paymentChannel, purchaseOptions, user } = options;

        //TODO: compute commission for agent and merchant here

        //record transaction
        const transactionCreateOptions: Prisma.TransactionUncheckedCreateInput =
            {
                amount: purchaseOptions.price,
                flow: TransactionFlow.OUT,
                status: TransactionStatus.PENDING,
                totalAmount: purchaseOptions.price,
                transactionId: generateId({ type: "transaction" }),
                type: TransactionType.DATA_PURCHASE,
                userId: user.id,
                billPaymentReference: billPaymentReference,
                billProviderId: billProvider.id,
                paymentChannel: paymentChannel,
                paymentReference: paymentReference,
                paymentStatus: PaymentStatus.PENDING,
                packageType: purchaseOptions.packageType,
                shortDescription: TransactionShortDescription.DATA_PURCHASE,
                serviceTransactionCode: purchaseOptions.dataCode,
                senderIdentifier: purchaseOptions.vtuNumber,
                billServiceSlug: purchaseOptions.billService,
                provider: purchaseOptions.billProvider,
            };

        const transaction = await this.prisma.transaction.create({
            data: transactionCreateOptions,
        });

        this.billEvent.emit("compute-bill-commission", {
            transactionId: transaction.id,
            userType: user.userType,
        });

        return {
            paymentReference: paymentReference,
        };
    }

    async processWebhookDataPurchase(options: ProcessBillPaymentOptions) {
        try {
            const transaction: CompleteDataPurchaseTransactionOptions =
                await this.prisma.transaction.findUnique({
                    where: {
                        paymentReference: options.paymentReference,
                    },
                    select: {
                        id: true,
                        billProviderId: true,
                        userId: true,
                        amount: true,
                        senderIdentifier: true, //vtuNumber
                        paymentStatus: true,
                        status: true,
                        billServiceSlug: true, //network provider
                        billPaymentReference: true,
                        paymentChannel: true,
                        serviceTransactionCode: true, //third party data bundle code
                    },
                });

            if (!transaction) {
                throw new TransactionNotFoundException(
                    "Failed to complete data purchase. Bill Initialization transaction record not found",
                    HttpStatus.NOT_FOUND
                );
            }

            if (transaction.paymentStatus == PaymentStatus.SUCCESS) {
                throw new DuplicateDataPurchaseException(
                    "Duplicate webhook data purchase payment event",
                    HttpStatus.BAD_REQUEST
                );
            }

            await this.prisma.transaction.update({
                where: { id: transaction.id },
                data: {
                    paymentStatus: PaymentStatus.SUCCESS,
                    paymentChannel: PaymentChannel.PAYSTACK_CHANNEL,
                },
            });

            const user: CompleteBillPurchaseUserOptions =
                await this.prisma.user.findUnique({
                    where: { id: transaction.userId },
                    select: { email: true, userType: true },
                });
            if (!user) {
                throw new UserNotFoundException(
                    "Failed to complete data purchase. Could not fetch user details",
                    HttpStatus.NOT_FOUND
                );
            }

            const billProvider = await this.prisma.billProvider.findUnique({
                where: {
                    id: transaction.billProviderId,
                },
            });

            if (!billProvider) {
                //TODO: AUTOMATION UPGRADE, check for an active provider and switch automatically
                throw new BillProviderNotFoundException(
                    "Failed to complete data purchase. Bill provider not found",
                    HttpStatus.NOT_FOUND
                );
            }

            //complete purchase
            await this.completeDataPurchase({
                transaction: transaction,
                user: user,
                billProvider: billProvider,
            });
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof IRechargeVendDataException: {
                    const transaction =
                        await this.prisma.transaction.findUnique({
                            where: {
                                paymentReference: options.paymentReference,
                            },
                        });
                    this.billEvent.emit("bill-purchase-failure", {
                        transactionId: transaction.id,
                    });
                }

                default:
                    break;
            }
        }
    }

    async completeDataPurchase(
        options: CompleteBillPurchaseOptions<CompleteDataPurchaseTransactionOptions>
    ): Promise<CompleteDataPurchaseOutput> {
        switch (options.billProvider.slug) {
            case BillProviderSlug.IRECHARGE: {
                const response = await this.iRechargeWorkflowService.vendData({
                    dataCode: options.transaction.serviceTransactionCode,
                    referenceId: options.transaction.billPaymentReference,
                    vtuNetwork: options.transaction
                        .billServiceSlug as NetworkDataProvider,
                    vtuNumber: options.transaction.senderIdentifier,
                    vtuEmail: options.user.email,
                });

                await this.prisma.$transaction(
                    async (tx) => {
                        await tx.transaction.update({
                            where: {
                                id: options.transaction.id,
                            },
                            data: {
                                status: TransactionStatus.SUCCESS,
                                token: response.networkProviderReference,
                                paymentChannel: options.isWalletPayment
                                    ? PaymentChannel.WALLET
                                    : options.transaction.paymentChannel,
                            },
                        });

                        this.billEvent.emit("pay-bill-commission", {
                            transactionId: options.transaction.id,
                            userType: options.user.userType,
                        });
                    },
                    {
                        timeout: DB_TRANSACTION_TIMEOUT,
                    }
                );

                return {
                    networkProviderReference: response.networkProviderReference,
                };
            }

            default: {
                throw new DataPurchaseException(
                    "Failed to complete data purchase. Invalid bill provider",
                    HttpStatus.NOT_IMPLEMENTED
                );
            }
        }
    }

    async walletPayment(options: PaymentReferenceDto, user: User) {
        const wallet = await this.prisma.wallet.findUnique({
            where: {
                userId: user.id,
            },
        });

        if (!wallet) {
            throw new WalletNotFoundException(
                "Wallet not created. Kindly setup your KYC",
                HttpStatus.NOT_FOUND
            );
        }

        const transaction = await this.prisma.transaction.findUnique({
            where: {
                paymentReference: options.reference,
            },
        });

        if (!transaction) {
            throw new TransactionNotFoundException(
                "Failed to complete wallet payment for data purchase. Payment reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.userId != user.id) {
            throw new TransactionNotFoundException(
                "Failed to complete wallet payment for data purchase. Invalid user payment reference",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.type != TransactionType.DATA_PURCHASE) {
            throw new InvalidBillTypePaymentReference(
                "Invalid data purchase reference",
                HttpStatus.BAD_REQUEST
            );
        }

        if (transaction.paymentStatus == PaymentStatus.SUCCESS) {
            throw new DuplicateDataPurchaseException(
                "Duplicate data purchase payment",
                HttpStatus.BAD_REQUEST
            );
        }

        if (wallet.mainBalance < transaction.amount) {
            this.billEvent.emit("payment-failure", {
                transactionId: transaction.id,
            });
            throw new InsufficientWalletBalanceException(
                "Insufficient wallet balance",
                HttpStatus.BAD_REQUEST
            );
        }

        const billProvider = await this.prisma.billProvider.findUnique({
            where: {
                id: transaction.billProviderId,
            },
        });

        if (!billProvider) {
            throw new DataPurchaseException(
                "Bill provider does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        if (!billProvider.isActive) {
            throw new DataPurchaseException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        //record payment
        await this.billService.walletChargeHandler({
            amount: transaction.amount,
            transactionId: transaction.id,
            walletId: wallet.id,
        });

        //purchase
        try {
            const purchaseInfo = await this.completeDataPurchase({
                billProvider: billProvider,
                transaction: transaction,
                user: {
                    email: user.email,
                    userType: user.userType,
                },
                isWalletPayment: true,
            });

            return buildResponse({
                message: "Data purchase successful",
                data: {
                    network: {
                        reference: purchaseInfo.networkProviderReference,
                    },
                    reference: options.reference,
                },
            });
        } catch (error) {
            switch (true) {
                case error instanceof IRechargeVendDataException: {
                    this.billEvent.emit("bill-purchase-failure", {
                        transactionId: transaction.id,
                    });
                    throw error;
                }
                case error instanceof WalletChargeException: {
                    this.billEvent.emit("payment-failure", {
                        transactionId: transaction.id,
                    });
                    throw error;
                }

                default: {
                    throw error;
                }
            }
        }
    }

    async verifyDataPurchase(options: PaymentReferenceDto, user: User) {
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                paymentReference: options.reference,
            },
            select: {
                type: true,
                status: true,
                token: true,
                userId: true,
                paymentReference: true,
                amount: true,
                senderIdentifier: true,
                packageType: true,
                paymentChannel: true,
                paymentStatus: true,
                serviceCharge: true,
                createdAt: true,
                updatedAt: true,
                transactionId: true,
                billService: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!transaction) {
            throw new TransactionNotFoundException(
                "Payment reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.userId != user.id) {
            throw new TransactionNotFoundException(
                "Payment reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.type != TransactionType.DATA_PURCHASE) {
            throw new InvalidBillTypePaymentReference(
                "Invalid data purchase reference",
                HttpStatus.BAD_REQUEST
            );
        }

        const data: VerifyPurchase<VerifyDataPurchaseData> = {
            status: transaction.status,
            transactionId: transaction.transactionId,
            paymentReference: transaction.paymentReference,
            amount: transaction.amount,
            phone: transaction.senderIdentifier,
            plan: transaction.packageType,
            networkReference: transaction.token,
            paymentChannel: transaction.paymentChannel,
            paymentStatus: transaction.paymentStatus,
            serviceCharge: transaction.serviceCharge,
            network: transaction.billService.name,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
            },
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
        };

        return buildResponse({
            message: "Data purchase successfully verified",
            data: data,
        });
    }

    async getDataNetworks() {
        let networks = [];
        const billProvider = await this.prisma.billProvider.findFirst({
            where: {
                isActive: true,
            },
        });
        if (billProvider) {
            const providerNetworks =
                await this.prisma.billProviderDataBundleNetwork.findMany({
                    where: {
                        billProviderSlug: billProvider.slug,
                    },
                    select: {
                        billProviderSlug: true,
                        billServiceSlug: true,
                        dataProvider: {
                            select: {
                                name: true,
                                icon: true,
                            },
                        },
                    },
                });
            networks = this.formatDataBundleNetwork(providerNetworks);
        }

        return buildResponse({
            message: "Data networks successfully retrieved",
            data: networks,
        });
    }

    formatDataBundleNetwork(
        networks: FormatDataBundleNetworkInput[]
    ): FormatDataBundleNetworkOutput[] {
        const formatted: FormatDataBundleNetworkOutput[] = networks.map(
            (network) => {
                return {
                    billProvider: network.billProviderSlug,
                    icon: network.dataProvider.icon,
                    name: network.dataProvider.name,
                    billService: network.billServiceSlug,
                };
            }
        );
        return formatted;
    }
}
