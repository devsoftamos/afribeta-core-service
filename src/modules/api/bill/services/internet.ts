import { PrismaService } from "@/modules/core/prisma/services";
import {
    GetInternetBundleResponse,
    NetworkInternetProvider,
    UnprocessedTransactionException,
    VendInternetFailureException,
    VendInternetInProgressException,
    VendInternetResponse,
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
import {
    BillProviderNotFoundException,
    PowerPurchaseException,
    InvalidBillTypePaymentReference,
    WalletChargeException,
    InternetPurchaseException,
    DuplicateInternetPurchaseException,
    InvalidBillProviderException,
} from "../errors";
import {
    BillProviderSlug,
    BillProviderSlugForPower,
    BillPurchaseInitializationHandlerOptions,
    CompleteBillPurchaseOptions,
    CompleteBillPurchaseUserOptions,
    ProcessBillPaymentOptions,
    PurchaseInitializationHandlerOutput,
    VerifyPurchase,
} from "../interfaces";

import logger from "moment-logger";
import { DB_TRANSACTION_TIMEOUT } from "@/config";
import { BillService } from ".";
import { BillEvent } from "../events";
import {
    GetInternetBundleDto,
    GetSmileDeviceInfoDto,
    PurchaseInternetDto,
} from "../dtos/internet";
import {
    CompleteInternetPurchaseOutput,
    CompleteInternetPurchaseTransactionOptions,
    FormatInternetBundleNetworkInput,
    FormatInternetBundleNetworkOutput,
    VerifyInternetPurchaseData,
} from "../interfaces/internet";
import { BuyPowerWorkflowService } from "@/modules/workflow/billPayment/providers/buyPower/services";
import { BuyPowerVendInProgressException } from "@/modules/workflow/billPayment/providers/buyPower";
import { InjectQueue } from "@nestjs/bull";
import {
    BillQueue,
    BuyPowerReQueryQueue,
    BuypowerReQueryJobOptions,
} from "../queues";
import { Queue } from "bull";

@Injectable()
export class InternetBillService {
    constructor(
        private iRechargeWorkflowService: IRechargeWorkflowService,
        private buyPowerWorkflowService: BuyPowerWorkflowService,
        private prisma: PrismaService,

        @Inject(forwardRef(() => BillService))
        private billService: BillService,
        private billEvent: BillEvent,
        @InjectQueue(BillQueue.BUYPOWER_REQUERY)
        private buypowerReQueryQueue: Queue<BuypowerReQueryJobOptions>
    ) {}

    async getInternetBundles(
        options: GetInternetBundleDto
    ): Promise<ApiResponse> {
        let internetBundles: GetInternetBundleResponse[] = [];
        let billProvider = await this.prisma.billProvider.findFirst({
            where: {
                isActive: true,
                AND: [
                    {
                        slug: {
                            not: BillProviderSlugForPower.IKEJA_ELECTRIC,
                        },
                    },
                    {
                        slug: options.billProvider,
                    },
                ],
            },
        });
        if (!billProvider) {
            billProvider = await this.prisma.billProvider.findFirst({
                where: {
                    isActive: true,
                    slug: {
                        notIn: [
                            BillProviderSlugForPower.IKEJA_ELECTRIC,
                            options.billProvider,
                        ],
                    },
                },
            });
        }

        if (billProvider) {
            switch (billProvider.slug) {
                case BillProviderSlug.IRECHARGE: {
                    const iRechargeDataBundles =
                        await this.iRechargeWorkflowService.getInternetBundles(
                            options.billService
                        );
                    internetBundles = [
                        ...internetBundles,
                        ...iRechargeDataBundles,
                    ];
                    break;
                }
                case BillProviderSlug.BUYPOWER: {
                    const iRechargeDataBundles =
                        await this.buyPowerWorkflowService.getInternetBundles(
                            options.billService
                        );
                    internetBundles = [
                        ...internetBundles,
                        ...iRechargeDataBundles,
                    ];
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
                bundles: internetBundles,
            },
        });
    }

    async getInternetNetworks() {
        let networks = [];
        let billProvider = await this.prisma.billProvider.findFirst({
            where: {
                isActive: true,
                isDefault: true,
                slug: {
                    not: BillProviderSlugForPower.IKEJA_ELECTRIC,
                },
            },
        });

        if (!billProvider) {
            billProvider = await this.prisma.billProvider.findFirst({
                where: {
                    isActive: true,
                    slug: {
                        not: BillProviderSlugForPower.IKEJA_ELECTRIC,
                    },
                },
            });
        }
        if (billProvider) {
            const providerNetworks =
                await this.prisma.billProviderInternetNetwork.findMany({
                    where: {
                        billProviderSlug: billProvider.slug,
                    },
                    select: {
                        billProviderSlug: true,
                        billServiceSlug: true,
                        internetProvider: {
                            select: {
                                name: true,
                                icon: true,
                            },
                        },
                    },
                });
            networks = this.formatInternetBundleNetwork(providerNetworks);
        }

        return buildResponse({
            message: "Internet networks successfully retrieved",
            data: networks,
        });
    }

    formatInternetBundleNetwork(
        networks: FormatInternetBundleNetworkInput[]
    ): FormatInternetBundleNetworkOutput[] {
        const formatted: FormatInternetBundleNetworkOutput[] = networks.map(
            (network) => {
                return {
                    billProvider: network.billProviderSlug,
                    icon: network.internetProvider.icon,
                    name: network.internetProvider.name,
                    billService: network.billServiceSlug,
                };
            }
        );
        return formatted;
    }

    async initializeInternetPurchase(
        options: PurchaseInternetDto,
        user: User
    ): Promise<ApiResponse> {
        const billProvider = await this.prisma.billProvider.findUnique({
            where: {
                slug: options.billProvider,
            },
        });

        if (!billProvider) {
            throw new InternetPurchaseException(
                "Bill provider does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        if (!billProvider.isActive) {
            throw new InternetPurchaseException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        const providerNetwork =
            await this.prisma.billProviderInternetNetwork.findUnique({
                where: {
                    billServiceSlug_billProviderSlug: {
                        billProviderSlug: options.billProvider,
                        billServiceSlug: options.billService,
                    },
                },
            });

        if (!providerNetwork) {
            throw new InternetPurchaseException(
                "The network provider service is not associated with the bill provider",
                HttpStatus.BAD_REQUEST
            );
        }

        const response = (resp: PurchaseInitializationHandlerOutput) => {
            return buildResponse({
                message: "Data purchase payment successfully initialized",
                data: {
                    amount: resp.totalAmount,
                    email: user.email,
                    reference: resp.paymentReference,
                },
            });
        };

        switch (options.paymentProvider) {
            case PaymentProvider.PAYSTACK: {
                const resp = await this.handleInternetPurchaseInitialization({
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
                const resp = await this.handleInternetPurchaseInitialization({
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

    async handleInternetPurchaseInitialization(
        options: BillPurchaseInitializationHandlerOptions<PurchaseInternetDto>
    ): Promise<PurchaseInitializationHandlerOutput> {
        const paymentReference = generateId({ type: "reference" });
        const billPaymentReference = generateId({
            type: "numeric",
            length: 12,
        });
        const { billProvider, paymentChannel, purchaseOptions, user } = options;

        //record transaction
        const transactionCreateOptions: Prisma.TransactionUncheckedCreateInput =
            {
                amount: purchaseOptions.price,
                flow: TransactionFlow.OUT,
                status: TransactionStatus.PENDING,
                totalAmount: purchaseOptions.price,
                transactionId: generateId({ type: "transaction" }),
                type: TransactionType.INTERNET_BILL,
                userId: user.id,
                billPaymentReference: billPaymentReference,
                billProviderId: billProvider.id,
                paymentChannel: paymentChannel,
                paymentReference: paymentReference,
                paymentStatus: PaymentStatus.PENDING,
                packageType: purchaseOptions.packageType,
                shortDescription: TransactionShortDescription.INTERNET_PURCHASE,
                serviceTransactionCode: purchaseOptions.internetCode,
                senderIdentifier: purchaseOptions.vtuNumber,
                billServiceSlug: purchaseOptions.billService,
                provider: purchaseOptions.billProvider,
                merchantId: user.createdById,
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
            totalAmount: transactionCreateOptions.totalAmount,
        };
    }

    async processWebhookInternetPurchase(options: ProcessBillPaymentOptions) {
        try {
            const transaction: CompleteInternetPurchaseTransactionOptions =
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
                        serviceTransactionCode: true, //third party internet bundle code
                    },
                });

            if (!transaction) {
                throw new TransactionNotFoundException(
                    "Failed to complete internet purchase. Bill Initialization transaction record not found",
                    HttpStatus.NOT_FOUND
                );
            }

            if (transaction.paymentStatus !== PaymentStatus.PENDING) {
                throw new DuplicateInternetPurchaseException(
                    "Duplicate webhook internet purchase payment event",
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
                    "Failed to complete internet purchase. User details not found",
                    HttpStatus.NOT_FOUND
                );
            }

            const billProvider = await this.prisma.billProvider.findUnique({
                where: {
                    id: transaction.billProviderId,
                },
            });

            if (!billProvider) {
                this.billEvent.emit("bill-purchase-failure", {
                    transactionId: transaction.id,
                });
                throw new BillProviderNotFoundException(
                    "Failed to complete internet purchase. Bill provider not found",
                    HttpStatus.NOT_FOUND
                );
            }

            //complete purchase
            await this.completeInternetPurchase({
                transaction: transaction,
                user: user,
                billProvider: billProvider,
            });
        } catch (error) {
            logger.error(error);
        }
    }

    async completeInternetPurchase(
        options: CompleteBillPurchaseOptions<CompleteInternetPurchaseTransactionOptions>
    ): Promise<CompleteInternetPurchaseOutput> {
        let vendInternetResp: VendInternetResponse;

        try {
            switch (options.billProvider.slug) {
                case BillProviderSlug.IRECHARGE: {
                    vendInternetResp =
                        await this.iRechargeWorkflowService.vendInternet({
                            internetCode:
                                options.transaction.serviceTransactionCode,
                            referenceId:
                                options.transaction.billPaymentReference,
                            vtuNetwork: options.transaction
                                .billServiceSlug as NetworkInternetProvider,
                            vtuNumber: options.transaction.senderIdentifier,
                            vtuEmail: options.user.email,
                        });

                    return await this.successPurchaseHandler(
                        options,
                        vendInternetResp
                    );
                }
                case BillProviderSlug.BUYPOWER: {
                    vendInternetResp =
                        await this.buyPowerWorkflowService.vendInternet({
                            internetCode:
                                options.transaction.serviceTransactionCode,
                            referenceId:
                                options.transaction.billPaymentReference,
                            vtuNetwork: options.transaction
                                .billServiceSlug as NetworkInternetProvider,
                            vtuNumber: options.transaction.senderIdentifier,
                            vtuEmail: options.user.email,
                            amount: options.transaction.amount,
                        });

                    return await this.successPurchaseHandler(
                        options,
                        vendInternetResp
                    );
                }

                default: {
                    throw new VendInternetFailureException(
                        "Failed to complete internet purchase. Bill provider not integrated",
                        HttpStatus.NOT_IMPLEMENTED
                    );
                }
            }
        } catch (error) {
            switch (true) {
                case error instanceof BuyPowerVendInProgressException: {
                    await this.buypowerReQueryQueue.add(
                        BuyPowerReQueryQueue.INTERNET,
                        {
                            orderId: options.transaction.billPaymentReference,
                            transactionId: options.transaction.id,
                            isWalletPayment: options.isWalletPayment,
                        }
                    );
                    throw new VendInternetInProgressException(
                        "Internet vending in progress",
                        HttpStatus.ACCEPTED
                    );
                }
                case error instanceof UnprocessedTransactionException: {
                    throw new VendInternetFailureException(
                        "Failed to vend internet",
                        HttpStatus.NOT_IMPLEMENTED
                    );
                }

                default: {
                    this.billEvent.emit("bill-purchase-failure", {
                        transactionId: options.transaction.id,
                    });
                    throw error;
                }
            }
        }
    }

    async successPurchaseHandler(
        options: CompleteBillPurchaseOptions<CompleteInternetPurchaseTransactionOptions>,
        vendInternetResp: VendInternetResponse
    ): Promise<CompleteInternetPurchaseOutput> {
        await this.prisma.$transaction(
            async (tx) => {
                await tx.transaction.update({
                    where: {
                        id: options.transaction.id,
                    },
                    data: {
                        status: TransactionStatus.SUCCESS,
                        token: vendInternetResp.networkProviderReference,
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
            networkProviderReference: vendInternetResp.networkProviderReference,
            amount: vendInternetResp.amount,
            phone: vendInternetResp.receiver,
        };
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
                "Failed to complete wallet payment for internet purchase. Payment reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.userId != user.id) {
            throw new TransactionNotFoundException(
                "Failed to complete wallet payment for internet purchase. Invalid user payment reference",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.type != TransactionType.INTERNET_BILL) {
            throw new InvalidBillTypePaymentReference(
                "Invalid internet purchase reference",
                HttpStatus.BAD_REQUEST
            );
        }

        if (transaction.paymentStatus == PaymentStatus.SUCCESS) {
            throw new DuplicateInternetPurchaseException(
                "Duplicate internet bill payment",
                HttpStatus.BAD_REQUEST
            );
        }

        if (wallet.mainBalance < transaction.totalAmount) {
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
            throw new InternetPurchaseException(
                "Bill provider does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        if (!billProvider.isActive) {
            throw new InternetPurchaseException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        //purchase
        try {
            //record payment
            await this.billService.walletChargeHandler({
                amount: transaction.totalAmount,
                transactionId: transaction.id,
                walletId: wallet.id,
            });

            const purchaseInfo = await this.completeInternetPurchase({
                billProvider: billProvider,
                transaction: transaction,
                user: {
                    email: user.email,
                    userType: user.userType,
                },
                isWalletPayment: true,
            });

            return buildResponse({
                message: "Internet purchase successful",
                data: {
                    reference: options.reference,
                    amount: transaction.amount,
                    phone: transaction.senderIdentifier,
                    package: transaction.packageType,
                    network: {
                        reference: purchaseInfo.networkProviderReference,
                    },
                },
            });
        } catch (error) {
            switch (true) {
                case error instanceof VendInternetFailureException: {
                    throw error;
                }
                case error instanceof VendInternetInProgressException: {
                    return buildResponse({
                        message: "Vending in progress",
                    });
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

    async verifyInternetPurchase(options: PaymentReferenceDto, user: User) {
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

        if (transaction.type != TransactionType.INTERNET_BILL) {
            throw new InvalidBillTypePaymentReference(
                "Invalid internet purchase reference",
                HttpStatus.BAD_REQUEST
            );
        }

        const data: VerifyPurchase<VerifyInternetPurchaseData> = {
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
            message: "Internet purchase successfully verified",
            data: data,
        });
    }

    async getSmileDeviceInfo(options: GetSmileDeviceInfoDto) {
        switch (options.billProvider) {
            case BillProviderSlug.IRECHARGE: {
                const resp =
                    await this.iRechargeWorkflowService.getSmileDeviceInfo({
                        deviceId: options.deviceId,
                    });
                return buildResponse({
                    message: "Successfully verified smile information",
                    data: resp,
                });
            }

            default: {
                throw new InvalidBillProviderException(
                    "Invalid bill provider",
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }
}
