import { PrismaService } from "@/modules/core/prisma/services";
import {
    CableTVProvider,
    GetDataBundleResponse,
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
    UserType,
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
    InvalidBillTypePaymentReference,
    WalletChargeException,
    InvalidBillProviderException,
    CableTVPurchaseException,
    DuplicateCableTVPurchaseException,
} from "../errors";
import {
    BillProviderSlug,
    BillPurchaseInitializationHandlerOptions,
    CompleteBillPurchaseOptions,
    CompleteBillPurchaseUserOptions,
    ProcessBillPaymentOptions,
    VerifyPurchase,
} from "../interfaces";
import { FormatDataBundleNetworkOutput } from "../interfaces/data";
import logger from "moment-logger";
import { DB_TRANSACTION_TIMEOUT } from "@/config";
import { BillService } from ".";
import { IRechargeVendCableTVException } from "@/modules/workflow/billPayment/providers/iRecharge";
import { BillEvent } from "../events";
import {
    CableTVPurchaseInitializationHandlerOutput,
    CompleteCableTVPurchaseOutput,
    CompleteCableTVPurchaseTransactionOptions,
    FormatCableTVNetworkInput,
    FormatCableTVNetworkOutput,
    VerifyCableTVPurchaseData,
} from "../interfaces/cabletv";
import {
    GetSmartCardInfoDto,
    GetTVBouquetDto,
    PurchaseTVDto,
} from "../dtos/cabletv";

@Injectable()
export class CableTVBillService {
    constructor(
        private iRechargeWorkflowService: IRechargeWorkflowService,
        private prisma: PrismaService,

        @Inject(forwardRef(() => BillService))
        private billService: BillService,
        private billEvent: BillEvent
    ) {}

    async getTVNetworks() {
        let networks = [];
        const billProvider = await this.prisma.billProvider.findFirst({
            where: {
                isActive: true,
            },
        });
        if (billProvider) {
            const providerNetworks =
                await this.prisma.billProviderCableTVNetwork.findMany({
                    where: {
                        billProviderSlug: billProvider.slug,
                    },
                    select: {
                        billProviderSlug: true,
                        billServiceSlug: true,
                        cableTVProvider: {
                            select: {
                                name: true,
                                icon: true,
                            },
                        },
                    },
                });
            networks = this.formatCableTVNetwork(providerNetworks);
        }

        return buildResponse({
            message: "Cable TV networks successfully retrieved",
            data: networks,
        });
    }

    formatCableTVNetwork(
        networks: FormatCableTVNetworkInput[]
    ): FormatCableTVNetworkOutput[] {
        const formatted: FormatDataBundleNetworkOutput[] = networks.map(
            (network) => {
                return {
                    billProvider: network.billProviderSlug,
                    icon: network.cableTVProvider.icon,
                    name: network.cableTVProvider.name,
                    billService: network.billServiceSlug,
                };
            }
        );
        return formatted;
    }

    async getTVBouquets(options: GetTVBouquetDto): Promise<ApiResponse> {
        let tvBouquets: GetDataBundleResponse[] = [];
        const provider = await this.prisma.billProvider.findFirst({
            where: { isActive: true },
        });

        if (provider) {
            switch (provider.slug) {
                case BillProviderSlug.IRECHARGE: {
                    const iRechargeDataBundles =
                        await this.iRechargeWorkflowService.getCableTVBouquets(
                            options.billService
                        );
                    tvBouquets = [...tvBouquets, ...iRechargeDataBundles];
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
            message: "Successfully retrieved TV bouquets",
            data: {
                billProvider: provider.slug,
                billService: options.billService,
                bundles: tvBouquets,
            },
        });
    }

    async getSmartCardInfo(options: GetSmartCardInfoDto) {
        switch (options.billProvider) {
            case BillProviderSlug.IRECHARGE: {
                const reference = generateId({
                    type: "numeric",
                    length: 12,
                });
                const resp =
                    await this.iRechargeWorkflowService.getSmartCardInfo({
                        reference: reference,
                        smartCardNumber: options.smartCardNumber,
                        tvCode:
                            options.billService == "startimes"
                                ? "StarTimes"
                                : options.tvCode,
                        tvNetwork: options.billService,
                    });
                return buildResponse({
                    message: "Smart Card Information successfully retrieved",
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

    //

    async initializeCableTVPurchase(
        options: PurchaseTVDto,
        user: User
    ): Promise<ApiResponse> {
        const billProvider = await this.prisma.billProvider.findUnique({
            where: {
                slug: options.billProvider,
            },
        });

        if (!billProvider) {
            throw new CableTVPurchaseException(
                "Bill provider does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        if (!billProvider.isActive) {
            throw new CableTVPurchaseException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        const providerNetwork =
            await this.prisma.billProviderCableTVNetwork.findUnique({
                where: {
                    billServiceSlug_billProviderSlug: {
                        billProviderSlug: options.billProvider,
                        billServiceSlug: options.billService,
                    },
                },
                select: {
                    cableTVProvider: true,
                },
            });

        if (!providerNetwork) {
            throw new CableTVPurchaseException(
                "The network provider is not associated with the bill provider",
                HttpStatus.BAD_REQUEST
            );
        }

        const response = (resp: CableTVPurchaseInitializationHandlerOutput) => {
            return buildResponse({
                message: "Cable TV purchase payment successfully initialized",
                data: {
                    amount: options.price,
                    email: user.email,
                    reference: resp.paymentReference,
                },
            });
        };

        switch (options.paymentProvider) {
            case PaymentProvider.PAYSTACK: {
                const resp = await this.handleCableTVPurchaseInitialization({
                    billProvider: billProvider,
                    purchaseOptions: options,
                    user: user,
                    paymentChannel: PaymentChannel.PAYSTACK_CHANNEL,
                    billService: providerNetwork.cableTVProvider,
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
                const resp = await this.handleCableTVPurchaseInitialization({
                    billProvider: billProvider,
                    paymentChannel: PaymentChannel.WALLET,
                    purchaseOptions: options,
                    user: user,
                    wallet: wallet,
                    billService: providerNetwork.cableTVProvider,
                });
                return response(resp);
            }

            default: {
                throw new CableTVPurchaseException(
                    `Payment provider must be one of: ${PaymentProvider.PAYSTACK}, ${PaymentProvider.WALLET}`,
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    //TODO
    async handleCableTVPurchaseInitialization(
        options: BillPurchaseInitializationHandlerOptions<PurchaseTVDto>
    ): Promise<CableTVPurchaseInitializationHandlerOutput> {
        const paymentReference = generateId({ type: "reference" });
        const billPaymentReference = generateId({
            type: "numeric",
            length: 12,
        });
        const {
            billProvider,
            paymentChannel,
            purchaseOptions,
            user,
            billService,
        } = options;

        //TODO: compute commission for agent and merchant here

        //record transaction
        const transactionCreateOptions: Prisma.TransactionUncheckedCreateInput =
            {
                amount: purchaseOptions.price,
                flow: TransactionFlow.OUT,
                status: TransactionStatus.PENDING,
                totalAmount: purchaseOptions.price,
                transactionId: generateId({ type: "transaction" }),
                type: TransactionType.CABLETV_BILL,
                userId: user.id,
                billPaymentReference: billPaymentReference,
                billProviderId: billProvider.id,
                paymentChannel: paymentChannel,
                paymentReference: paymentReference,
                paymentStatus: PaymentStatus.PENDING,
                packageType: purchaseOptions.packageType,
                shortDescription: `${billService?.name ?? "Cable TV"} Payment`,
                serviceTransactionCode: purchaseOptions.accessToken,
                senderIdentifier: purchaseOptions.smartCardNumber,
                billServiceSlug: purchaseOptions.billService,
                provider: purchaseOptions.billProvider,
                serviceTransactionCode2: purchaseOptions.tvCode,
                receiverIdentifier: purchaseOptions.phone,
                description: purchaseOptions.narration,
            };

        await this.prisma.transaction.create({
            data: transactionCreateOptions,
        });

        return {
            paymentReference: paymentReference,
        };
    }

    async processWebhookCableTVPurchase(options: ProcessBillPaymentOptions) {
        try {
            const transaction: CompleteCableTVPurchaseTransactionOptions =
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
                        serviceTransactionCode2: true,
                        receiverIdentifier: true,
                    },
                });

            if (!transaction) {
                throw new TransactionNotFoundException(
                    "Failed to complete cable tv purchase. Bill Initialization transaction record not found",
                    HttpStatus.NOT_FOUND
                );
            }

            if (transaction.paymentStatus == PaymentStatus.SUCCESS) {
                throw new DuplicateCableTVPurchaseException(
                    "Duplicate webhook cable tv purchase payment event",
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
                    "Failed to complete cable tv purchase. Could not fetch user details",
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
                    "Failed to complete cable tv purchase. Bill provider not found",
                    HttpStatus.NOT_FOUND
                );
            }

            //complete purchase
            await this.completeCableTVPurchase({
                transaction: transaction,
                user: user,
                billProvider: billProvider,
            });
        } catch (error) {
            switch (true) {
                case error instanceof IRechargeVendCableTVException: {
                    const transaction =
                        await this.prisma.transaction.findUnique({
                            where: {
                                paymentReference: options.paymentReference,
                            },
                        });
                    this.billEvent.emit("bill-purchase-failure", {
                        transaction: transaction,
                    });
                }

                default:
                    break;
            }
            logger.error(error);
        }
    }

    async completeCableTVPurchase(
        options: CompleteBillPurchaseOptions<CompleteCableTVPurchaseTransactionOptions>
    ): Promise<CompleteCableTVPurchaseOutput> {
        switch (options.billProvider.slug) {
            case BillProviderSlug.IRECHARGE: {
                //TODO: AUTOMATION UPGRADE, if iRecharge service fails, check for an active provider and switch automatically
                const response = await this.iRechargeWorkflowService.vendTV({
                    tvCode: options.transaction.serviceTransactionCode2,
                    referenceId: options.transaction.billPaymentReference,
                    accessToken: options.transaction.serviceTransactionCode,
                    smartCardNumber: options.transaction.senderIdentifier,
                    tvNetwork: options.transaction
                        .billServiceSlug as CableTVProvider,
                    email: options.user.email,
                    phone: options.transaction.receiverIdentifier,
                });

                await this.prisma.$transaction(
                    async (tx) => {
                        await tx.transaction.update({
                            where: {
                                id: options.transaction.id,
                            },
                            data: {
                                status: TransactionStatus.SUCCESS,
                                paymentChannel: options.isWalletPayment
                                    ? PaymentChannel.WALLET
                                    : options.transaction.paymentChannel,
                            },
                        });

                        //TODO: for agent and merchant, credit wallet commission balance
                        if (
                            options.user.userType == UserType.MERCHANT ||
                            options.user.userType == UserType.AGENT
                        ) {
                        }
                    },
                    {
                        timeout: DB_TRANSACTION_TIMEOUT,
                    }
                );

                return {
                    orderMessage: response.orderMessage,
                };
            }

            default: {
                throw new CableTVPurchaseException(
                    "Failed to complete cable tv purchase. Invalid bill provider",
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
                "Failed to complete wallet payment for cable tv purchase. Payment reference not found",
                HttpStatus.NOT_FOUND
            );
        }
        if (transaction.userId != user.id) {
            throw new TransactionNotFoundException(
                "Failed to complete wallet payment for cable tv purchase. Invalid user payment reference",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.type != TransactionType.CABLETV_BILL) {
            throw new InvalidBillTypePaymentReference(
                "Invalid cable tv purchase reference",
                HttpStatus.BAD_REQUEST
            );
        }

        if (transaction.paymentStatus == PaymentStatus.SUCCESS) {
            throw new DuplicateCableTVPurchaseException(
                "Duplicate cable tv purchase payment",
                HttpStatus.BAD_REQUEST
            );
        }

        if (wallet.mainBalance < transaction.amount) {
            this.billEvent.emit("payment-failure", {
                transaction: transaction,
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
            throw new CableTVPurchaseException(
                "Bill provider does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        if (!billProvider.isActive) {
            //TODO: AUTOMATION UPGRADE, check for an active provider and switch automatically
            throw new CableTVPurchaseException(
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
            await this.completeCableTVPurchase({
                billProvider: billProvider,
                transaction: transaction,
                user: {
                    email: user.email,
                    userType: user.userType,
                },
                isWalletPayment: true,
            });

            return buildResponse({
                message: "Cable TV purchase successful",
            });
        } catch (error) {
            switch (true) {
                case error instanceof IRechargeVendCableTVException: {
                    this.billEvent.emit("bill-purchase-failure", {
                        transaction: transaction,
                    });
                    throw error;
                }
                case error instanceof WalletChargeException: {
                    this.billEvent.emit("payment-failure", {
                        transaction: transaction,
                    });
                    throw error;
                }

                default: {
                    throw error;
                }
            }
        }
    }

    async verifyCableTVPurchase(options: PaymentReferenceDto, user: User) {
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                paymentReference: options.reference,
            },
            select: {
                type: true,
                status: true,
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
                receiverIdentifier: true,
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
                "Invalid user payment reference",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.type != TransactionType.CABLETV_BILL) {
            throw new InvalidBillTypePaymentReference(
                "Invalid cable tv purchase reference",
                HttpStatus.BAD_REQUEST
            );
        }

        const data: VerifyPurchase<VerifyCableTVPurchaseData> = {
            status: transaction.status,
            transactionId: transaction.transactionId,
            paymentReference: transaction.paymentReference,
            amount: transaction.amount,
            smartCardNumber: transaction.senderIdentifier,
            phone: transaction.receiverIdentifier,
            plan: transaction.packageType,
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
            message: "Cable TV purchase status successfully verified",
            data: data,
        });
    }
}
