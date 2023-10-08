import { PrismaService } from "@/modules/core/prisma/services";
import {
    CableTVProvider,
    GetDataBundleResponse,
    GetSmartCardInfoResponse,
    UnprocessedTransactionException,
    VendCableTVFailureException,
    VendCableTVInProgressException,
    VendCableTVResponse,
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
import { TransactionNotFoundException } from "../../transaction";
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
    CableTVPurchaseInitializationHandlerException,
} from "../errors";
import {
    BillProviderSlug,
    BillProviderSlugForPower,
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
import { BuyPowerWorkflowService } from "@/modules/workflow/billPayment/providers/buyPower/services";
import { InjectQueue } from "@nestjs/bull";
import {
    BillQueue,
    BuyPowerReQueryQueue,
    BuypowerReQueryJobOptions,
} from "../queues";
import { Queue } from "bull";
import { BuyPowerVendInProgressException } from "@/modules/workflow/billPayment/providers/buyPower";

@Injectable()
export class CableTVBillService {
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

    async getTVNetworks() {
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
                        await this.iRechargeWorkflowService.getCableTVBouquets(
                            options.billService
                        );
                    tvBouquets = [...tvBouquets, ...iRechargeDataBundles];
                    break;
                }
                case BillProviderSlug.BUYPOWER: {
                    const iRechargeDataBundles =
                        await this.buyPowerWorkflowService.getCableTVBouquets(
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
                billProvider: billProvider.slug,
                billService: options.billService,
                bundles: tvBouquets,
            },
        });
    }

    async getSmartCardInfo(options: GetSmartCardInfoDto) {
        let resp: GetSmartCardInfoResponse;
        switch (options.billProvider) {
            case BillProviderSlug.IRECHARGE: {
                const reference = generateId({
                    type: "numeric",
                    length: 12,
                });
                resp = await this.iRechargeWorkflowService.getSmartCardInfo({
                    reference: reference,
                    smartCardNumber: options.smartCardNumber,
                    tvCode:
                        options.billService == "startimes"
                            ? "StarTimes"
                            : options.tvCode,
                    tvNetwork: options.billService,
                });
                break;
            }

            case BillProviderSlug.BUYPOWER: {
                resp = await this.buyPowerWorkflowService.getSmartCardInfo({
                    smartCardNumber: options.smartCardNumber,
                    tvNetwork: options.billService,
                });
                break;
            }

            default: {
                throw new InvalidBillProviderException(
                    "Invalid bill provider",
                    HttpStatus.BAD_REQUEST
                );
            }
        }
        return buildResponse({
            message: "Smart Card Information successfully retrieved",
            data: resp,
        });
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
                    amount: options.price + options.serviceCharge,
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

        //record transaction
        const transactionCreateOptions: Prisma.TransactionUncheckedCreateInput =
            {
                amount: purchaseOptions.price,
                flow: TransactionFlow.OUT,
                status: TransactionStatus.PENDING,
                totalAmount:
                    purchaseOptions.price +
                    options.purchaseOptions.serviceCharge,
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
                senderIdentifier: purchaseOptions.smartCardNumber,
                billServiceSlug: purchaseOptions.billService,
                provider: purchaseOptions.billProvider,
                serviceTransactionCode: purchaseOptions.tvCode,
                receiverIdentifier: purchaseOptions.phone,
                description: purchaseOptions.narration,
                serviceCharge: options.purchaseOptions.serviceCharge,
                merchantId: user.createdById,
            };

        switch (billProvider.slug) {
            //iRecharge provider
            case BillProviderSlug.IRECHARGE: {
                if (!purchaseOptions.accessToken) {
                    throw new CableTVPurchaseInitializationHandlerException(
                        `Access token is required`,
                        HttpStatus.BAD_REQUEST
                    );
                }
                transactionCreateOptions.serviceTransactionCode2 =
                    purchaseOptions.accessToken;
            }
            //buypower provider
            case BillProviderSlugForPower.BUYPOWER: {
                break;
            }

            default: {
                throw new CableTVPurchaseInitializationHandlerException(
                    "Third party power vending provider not integrated or supported",
                    HttpStatus.NOT_IMPLEMENTED
                );
            }
        }

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
                        serviceTransactionCode: true, //third party tv package code
                        serviceTransactionCode2: true, //access token for irecharge provider
                        receiverIdentifier: true,
                    },
                });

            if (!transaction) {
                throw new TransactionNotFoundException(
                    "Failed to complete cable tv purchase. Bill Initialization transaction record not found",
                    HttpStatus.NOT_FOUND
                );
            }

            if (transaction.paymentStatus !== PaymentStatus.PENDING) {
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
                this.billEvent.emit("bill-purchase-failure", {
                    transactionId: transaction.id,
                });
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
            logger.error(error);
        }
    }

    async completeCableTVPurchase(
        options: CompleteBillPurchaseOptions<CompleteCableTVPurchaseTransactionOptions>
    ): Promise<CompleteCableTVPurchaseOutput> {
        let vendCableTvResp: VendCableTVResponse;
        try {
            switch (options.billProvider.slug) {
                case BillProviderSlug.IRECHARGE: {
                    vendCableTvResp =
                        await this.iRechargeWorkflowService.vendCableTV({
                            tvCode: options.transaction.serviceTransactionCode,
                            referenceId:
                                options.transaction.billPaymentReference,
                            accessToken:
                                options.transaction.serviceTransactionCode,
                            smartCardNumber:
                                options.transaction.senderIdentifier,
                            tvNetwork: options.transaction
                                .billServiceSlug as CableTVProvider,
                            email: options.user.email,
                            phone: options.transaction.receiverIdentifier,
                        });

                    return await this.successPurchaseHandler(
                        options,
                        vendCableTvResp
                    );
                }
                case BillProviderSlug.BUYPOWER: {
                    vendCableTvResp =
                        await this.buyPowerWorkflowService.vendCableTV({
                            tvCode: options.transaction.serviceTransactionCode,
                            referenceId:
                                options.transaction.billPaymentReference,
                            smartCardNumber:
                                options.transaction.senderIdentifier,
                            tvNetwork: options.transaction
                                .billServiceSlug as CableTVProvider,
                            email: options.user.email,
                            phone: options.transaction.receiverIdentifier,
                            amount: options.transaction.amount,
                        });

                    return await this.successPurchaseHandler(
                        options,
                        vendCableTvResp
                    );
                }

                default: {
                    throw new VendCableTVFailureException(
                        "Failed to complete cable tv purchase. Bill provider not integrated",
                        HttpStatus.NOT_IMPLEMENTED
                    );
                }
            }
        } catch (error) {
            switch (true) {
                case error instanceof BuyPowerVendInProgressException: {
                    await this.buypowerReQueryQueue.add(
                        BuyPowerReQueryQueue.CABLE_TV,
                        {
                            orderId: options.transaction.billPaymentReference,
                            transactionId: options.transaction.id,
                            isWalletPayment: options.isWalletPayment,
                        }
                    );
                    throw new VendCableTVInProgressException(
                        "Cable TV vending in progress",
                        HttpStatus.ACCEPTED
                    );
                }
                case error instanceof UnprocessedTransactionException: {
                    throw new VendCableTVFailureException(
                        "Failed to vend cable tv",
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
        options: CompleteBillPurchaseOptions<CompleteCableTVPurchaseTransactionOptions>,
        vendCableTVResp?: VendCableTVResponse
    ): Promise<CompleteCableTVPurchaseOutput> {
        await this.prisma.$transaction(
            async (tx) => {
                await tx.transaction.update({
                    where: {
                        id: options.transaction.id,
                    },
                    data: {
                        status: TransactionStatus.SUCCESS,
                        token: vendCableTVResp.vendRef,
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
            vendRef: vendCableTVResp.vendRef,
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

        //purchase
        try {
            //charge wallet and update payment status
            await this.billService.walletChargeHandler({
                amount: transaction.amount,
                transactionId: transaction.id,
                walletId: wallet.id,
            });

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
                data: {
                    reference: options.reference,
                },
            });
        } catch (error) {
            switch (true) {
                case error instanceof VendCableTVFailureException: {
                    throw error;
                }
                case error instanceof VendCableTVInProgressException: {
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
