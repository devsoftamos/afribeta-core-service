import { PrismaService } from "@/modules/core/prisma/services";
import {
    NetworkAirtimeProvider,
    UnprocessedTransactionException,
    VendAirtimeFailureException,
    VendAirtimeResponse,
    VendAirtimeInProgressException,
} from "@/modules/workflow/billPayment";
import { IRechargeWorkflowService } from "@/modules/workflow/billPayment/providers/iRecharge/services";
import { ApiResponse, buildResponse, generateId } from "@/utils";
import {
    forwardRef,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
} from "@nestjs/common";
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
    DataPurchaseException,
    DuplicateDataPurchaseException,
    PowerPurchaseException,
    InvalidBillTypePaymentReference,
    WalletChargeException,
    DuplicateAirtimePurchaseException,
    AirtimePurchaseException,
    UnavailableBillProviderAirtimeNetwork,
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
    CompleteAirtimePurchaseOutput,
    CompleteAirtimePurchaseTransactionOptions,
    FormatAirtimeNetworkInput,
    FormatAirtimeNetworkOutput,
    VerifyAirtimePurchaseData,
} from "../interfaces/airtime";
import { PurchaseAirtimeDto } from "../dtos/airtime";
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
export class AirtimeBillService {
    constructor(
        private iRechargeWorkflowService: IRechargeWorkflowService,
        private prisma: PrismaService,
        private buyPowerWorkflowService: BuyPowerWorkflowService,

        @Inject(forwardRef(() => BillService))
        private billService: BillService,
        private billEvent: BillEvent,
        @InjectQueue(BillQueue.BUYPOWER_REQUERY)
        private buypowerReQueryQueue: Queue<BuypowerReQueryJobOptions>
    ) {}

    async getAirtimeNetworks() {
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
                await this.prisma.billProviderAirtimeNetwork.findMany({
                    where: {
                        billProviderSlug: billProvider.slug,
                    },
                    select: {
                        billProviderSlug: true,
                        billServiceSlug: true,
                        airtimeProvider: {
                            select: {
                                name: true,
                                icon: true,
                            },
                        },
                    },
                });
            networks = this.formatAirtimeNetwork(providerNetworks);
        }

        return buildResponse({
            message: "Airtime networks successfully retrieved",
            data: networks,
        });
    }

    async initializeAirtimePurchase(
        options: PurchaseAirtimeDto,
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
            throw new PowerPurchaseException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        const providerNetwork =
            await this.prisma.billProviderAirtimeNetwork.findUnique({
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

        const response = (resp: PurchaseInitializationHandlerOutput) => {
            return buildResponse({
                message: "Airtime purchase payment successfully initialized",
                data: {
                    amount: resp.totalAmount,
                    email: user.email,
                    reference: resp.paymentReference,
                },
            });
        };

        switch (options.paymentProvider) {
            case PaymentProvider.PAYSTACK: {
                const resp = await this.handleAirtimePurchaseInitialization({
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
                if (wallet.mainBalance < options.vtuAmount) {
                    throw new InsufficientWalletBalanceException(
                        "Insufficient wallet balance",
                        HttpStatus.BAD_REQUEST
                    );
                }
                const resp = await this.handleAirtimePurchaseInitialization({
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

    async handleAirtimePurchaseInitialization(
        options: BillPurchaseInitializationHandlerOptions<PurchaseAirtimeDto>
    ): Promise<PurchaseInitializationHandlerOutput> {
        const paymentReference = generateId({ type: "reference" });
        const billPaymentReference = generateId({
            type: "irecharge_ref",
        });
        const { billProvider, paymentChannel, purchaseOptions, user } = options;

        //record transaction
        const transactionCreateOptions: Prisma.TransactionUncheckedCreateInput =
            {
                amount: purchaseOptions.vtuAmount,
                flow: TransactionFlow.OUT,
                status: TransactionStatus.PENDING,
                totalAmount: purchaseOptions.vtuAmount,
                transactionId: generateId({ type: "transaction" }),
                type: TransactionType.AIRTIME_PURCHASE,
                userId: user.id,
                billPaymentReference: billPaymentReference,
                billProviderId: billProvider.id,
                paymentChannel: paymentChannel,
                paymentReference: paymentReference,
                paymentStatus: PaymentStatus.PENDING,
                shortDescription: TransactionShortDescription.AIRTIME_PURCHASE,
                senderIdentifier: purchaseOptions.vtuNumber,
                billServiceSlug: purchaseOptions.billService,
                provider: purchaseOptions.billProvider,
                merchantId: user.createdById,
            };

        const transaction = await this.prisma.transaction.create({
            data: transactionCreateOptions,
            select: {
                id: true,
            },
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

    async processWebhookAirtimePurchase(options: ProcessBillPaymentOptions) {
        try {
            const transaction: CompleteAirtimePurchaseTransactionOptions =
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
                    },
                });

            if (!transaction) {
                throw new TransactionNotFoundException(
                    "Failed to complete airtime purchase. Bill Initialization transaction record not found",
                    HttpStatus.NOT_FOUND
                );
            }

            if (transaction.paymentStatus !== PaymentStatus.PENDING) {
                throw new DuplicateDataPurchaseException(
                    "Duplicate webhook airtime purchase payment event",
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
                    "Failed to complete airtime purchase. Could not fetch user details",
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
                    "Failed to complete airtime purchase. Bill provider not found",
                    HttpStatus.NOT_FOUND
                );
            }

            //complete purchase
            await this.completeAirtimePurchase({
                transaction: transaction,
                user: user,
                billProvider: billProvider,
            });
        } catch (error) {
            logger.error(error);
        }
    }

    async completeAirtimePurchase(
        options: CompleteBillPurchaseOptions<CompleteAirtimePurchaseTransactionOptions>
    ): Promise<CompleteAirtimePurchaseOutput> {
        let vendAirtimeResp: VendAirtimeResponse;
        try {
            switch (options.billProvider.slug) {
                case BillProviderSlug.IRECHARGE: {
                    vendAirtimeResp =
                        await this.iRechargeWorkflowService.vendAirtime({
                            referenceId:
                                options.transaction.billPaymentReference,
                            vtuNetwork: options.transaction
                                .billServiceSlug as NetworkAirtimeProvider,
                            vtuNumber: options.transaction.senderIdentifier,
                            vtuEmail: options.user.email,
                            vtuAmount: options.transaction.amount,
                        });

                    return await this.successPurchaseHandler(
                        options,
                        vendAirtimeResp
                    );
                }

                case BillProviderSlug.BUYPOWER: {
                    vendAirtimeResp =
                        await this.buyPowerWorkflowService.vendAirtime({
                            referenceId:
                                options.transaction.billPaymentReference,
                            vtuAmount: options.transaction.amount,
                            vtuNetwork: options.transaction
                                .billServiceSlug as NetworkAirtimeProvider,
                            vtuNumber: options.transaction.senderIdentifier,
                            vtuEmail: options.user.email,
                        });
                    return await this.successPurchaseHandler(
                        options,
                        vendAirtimeResp
                    );
                }

                default: {
                    throw new VendAirtimeFailureException(
                        "Failed to complete airtime purchase. Bill provider not integrated",
                        HttpStatus.NOT_IMPLEMENTED
                    );
                }
            }
        } catch (error) {
            return await this.autoSwitchProviderOnVendFailureHandler(
                options,
                error
            );
        }
    }

    async successPurchaseHandler(
        options: CompleteBillPurchaseOptions<CompleteAirtimePurchaseTransactionOptions>,
        vendAirtimeResp?: VendAirtimeResponse
    ): Promise<CompleteAirtimePurchaseOutput> {
        await this.prisma.$transaction(
            async (tx) => {
                await tx.transaction.update({
                    where: {
                        id: options.transaction.id,
                    },
                    data: {
                        status: TransactionStatus.SUCCESS,
                        token: vendAirtimeResp.networkProviderReference,
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

        if (vendAirtimeResp) {
            return {
                networkProviderReference:
                    vendAirtimeResp.networkProviderReference,
                amount: vendAirtimeResp.amount,
                phone: vendAirtimeResp.phone,
            };
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
                "Failed to complete wallet payment for airtime purchase. Payment reference not found",
                HttpStatus.NOT_FOUND
            );
        }
        if (transaction.userId != user.id) {
            throw new TransactionNotFoundException(
                "Failed to complete wallet payment for airtime purchase. Invalid user payment reference",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.type != TransactionType.AIRTIME_PURCHASE) {
            throw new InvalidBillTypePaymentReference(
                "Invalid airtime purchase reference",
                HttpStatus.BAD_REQUEST
            );
        }

        if (transaction.paymentStatus == PaymentStatus.SUCCESS) {
            throw new DuplicateAirtimePurchaseException(
                "Duplicate airtime purchase payment",
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
            throw new AirtimePurchaseException(
                "Failed to complete wallet payment for airtime purchase. Bill provider does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        if (!billProvider.isActive) {
            throw new AirtimePurchaseException(
                "Failed to complete wallet payment for airtime purchase. Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        try {
            await this.billService.walletChargeHandler({
                amount: transaction.totalAmount,
                transactionId: transaction.id,
                walletId: wallet.id,
            });

            const purchaseInfo = await this.completeAirtimePurchase({
                billProvider: billProvider,
                transaction: transaction,
                user: {
                    email: user.email,
                    userType: user.userType,
                },
                isWalletPayment: true,
            });

            return buildResponse({
                message: "Airtime purchase successful",
                data: {
                    reference: options.reference,
                    amount: transaction.amount,
                    phone: transaction.senderIdentifier,
                    network: {
                        reference: purchaseInfo.networkProviderReference,
                    },
                },
            });
        } catch (error) {
            switch (true) {
                case error instanceof VendAirtimeFailureException: {
                    throw error;
                }
                case error instanceof VendAirtimeInProgressException: {
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

    async verifyAirtimePurchase(options: PaymentReferenceDto, user: User) {
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

        if (transaction.type != TransactionType.AIRTIME_PURCHASE) {
            throw new InvalidBillTypePaymentReference(
                "Invalid airtime purchase reference",
                HttpStatus.BAD_REQUEST
            );
        }

        const data: VerifyPurchase<VerifyAirtimePurchaseData> = {
            status: transaction.status,
            transactionId: transaction.transactionId,
            paymentReference: transaction.paymentReference,
            amount: transaction.amount,
            phone: transaction.senderIdentifier,
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
            message: "Airtime purchase successfully verified",
            data: data,
        });
    }

    formatAirtimeNetwork(
        networks: FormatAirtimeNetworkInput[]
    ): FormatAirtimeNetworkOutput[] {
        const formatted: FormatAirtimeNetworkOutput[] = networks.map(
            (network) => {
                return {
                    billProvider: network.billProviderSlug,
                    icon: network.airtimeProvider.icon,
                    name: network.airtimeProvider.name,
                    billService: network.billServiceSlug,
                };
            }
        );
        return formatted;
    }

    async autoSwitchProviderOnVendFailureHandler(
        options: CompleteBillPurchaseOptions<CompleteAirtimePurchaseTransactionOptions>,
        error: HttpException
    ): Promise<CompleteAirtimePurchaseOutput> {
        const handleUnprocessedTransaction = async () => {
            //handle all providers
            const handleProviderSwitch = async (billProvider: BillProvider) => {
                const vendAirtimeResp =
                    await this.buyPowerWorkflowService.vendAirtime({
                        referenceId: options.transaction.billPaymentReference,
                        vtuAmount: options.transaction.amount,
                        vtuNetwork: options.transaction
                            .billServiceSlug as NetworkAirtimeProvider,
                        vtuNumber: options.transaction.senderIdentifier,
                        vtuEmail: options.user.email,
                    });
                await this.prisma.transaction.update({
                    where: {
                        id: options.transaction.id,
                    },
                    data: {
                        provider: billProvider.slug,
                        billProviderId: billProvider.id,
                    },
                });

                return await this.successPurchaseHandler(
                    options,
                    vendAirtimeResp
                );
            };

            //check other available active providers
            const billProviders = await this.prisma.billProvider.findMany({
                where: {
                    isActive: true,
                    id: { not: options.billProvider.id },
                    slug: {
                        not: BillProviderSlugForPower.IKEJA_ELECTRIC,
                    },
                },
            });
            if (!billProviders.length) {
                throw new VendAirtimeFailureException(
                    "Failed to vend airtime",
                    HttpStatus.NOT_IMPLEMENTED
                );
            }

            //switch automation
            for (let i = 0; i < billProviders.length; i++) {
                try {
                    const billProviderAirtimeNetwork =
                        await this.prisma.billProviderAirtimeNetwork.findUnique(
                            {
                                where: {
                                    billServiceSlug_billProviderSlug: {
                                        billProviderSlug: billProviders[i].slug,
                                        billServiceSlug:
                                            options.transaction.billServiceSlug,
                                    },
                                },
                            }
                        );

                    if (i == billProviders.length - 1) {
                        if (!billProviderAirtimeNetwork) {
                            throw new UnavailableBillProviderAirtimeNetwork(
                                `Failed to vend airtime. The auto selected provider does not have the bill service`,
                                HttpStatus.NOT_FOUND
                            );
                        }
                    }

                    if (billProviderAirtimeNetwork) {
                        switch (billProviders[i].slug) {
                            case BillProviderSlug.BUYPOWER: {
                                return await handleProviderSwitch(
                                    billProviders[i]
                                );
                            }
                            case BillProviderSlug.IRECHARGE: {
                                return await handleProviderSwitch(
                                    billProviders[i]
                                );
                            }

                            default: {
                                throw new VendAirtimeFailureException(
                                    error.message ?? "Failed to vend airtime",
                                    HttpStatus.NOT_IMPLEMENTED
                                );
                            }
                        }
                    }
                } catch (error) {
                    logger.error(error);
                    switch (true) {
                        case error instanceof
                            UnavailableBillProviderAirtimeNetwork: {
                            this.billEvent.emit("bill-purchase-failure", {
                                transactionId: options.transaction.id,
                            });
                            throw new VendAirtimeFailureException(
                                "Failed to vend airtime",
                                HttpStatus.NOT_IMPLEMENTED
                            );
                        }

                        case error instanceof BuyPowerVendInProgressException: {
                            await this.buypowerReQueryQueue.add(
                                BuyPowerReQueryQueue.AIRTIME,
                                {
                                    orderId:
                                        options.transaction
                                            .billPaymentReference,
                                    transactionId: options.transaction.id,
                                    isWalletPayment: options.isWalletPayment,
                                }
                            );
                            throw new VendAirtimeInProgressException(
                                "airtime vending in progress",
                                HttpStatus.ACCEPTED
                            );
                        }
                        case error instanceof UnprocessedTransactionException: {
                            if (i == billProviders.length - 1) {
                                this.billEvent.emit("bill-purchase-failure", {
                                    transactionId: options.transaction.id,
                                });
                                throw new VendAirtimeFailureException(
                                    "Failed to vend airtime",
                                    HttpStatus.NOT_IMPLEMENTED
                                );
                            }
                            break;
                        }

                        default: {
                            if (i == billProviders.length - 1) {
                                this.billEvent.emit("bill-purchase-failure", {
                                    transactionId: options.transaction.id,
                                });
                                throw error;
                            }
                            break;
                        }
                    }
                }
            }
        };

        switch (true) {
            case error instanceof UnprocessedTransactionException: {
                return await handleUnprocessedTransaction();
            }

            case error instanceof BuyPowerVendInProgressException: {
                await this.buypowerReQueryQueue.add(
                    BuyPowerReQueryQueue.AIRTIME,
                    {
                        orderId: options.transaction.billPaymentReference,
                        transactionId: options.transaction.id,
                        isWalletPayment: options.isWalletPayment,
                    }
                );
                throw new VendAirtimeInProgressException(
                    "airtime vending in progress",
                    HttpStatus.ACCEPTED
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
