import { PrismaService } from "@/modules/core/prisma/services";
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
    BillProviderElectricDisco,
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
import { GetMeterInfoDto, PurchasePowerDto } from "../dtos/power";
import {
    BillProviderNotFoundException,
    PowerPurchaseException,
    DuplicatePowerPurchaseException,
    PowerPurchaseInitializationHandlerException,
    InvalidBillTypePaymentReference,
    WalletChargeException,
    InvalidBillProviderException,
    BillProviderDiscoNotFound,
} from "../errors";
import {
    CompletePowerPurchaseOutput,
    CompletePowerPurchaseTransactionOptions,
    CompleteBillPurchaseUserOptions,
    BillPurchaseInitializationHandlerOptions,
    PowerPurchaseInitializationHandlerOutput,
    ProcessBillPaymentOptions,
    BillProviderSlug,
    CompleteBillPurchaseOptions,
    FormattedElectricDiscoData,
    MeterType,
    FormatDiscoOptions,
    BillProviderSlugForPower,
    VerifyPurchase,
    VerifyPowerPurchaseData,
} from "../interfaces";
import logger from "moment-logger";
import { UserNotFoundException } from "../../user";
import {
    WalletNotFoundException,
    InsufficientWalletBalanceException,
} from "../../wallet";
import { IRechargeVendPowerException } from "@/modules/workflow/billPayment/providers/iRecharge";
import { DB_TRANSACTION_TIMEOUT } from "@/config";
import { BillEvent } from "../events";
import { PaymentProvider, PaymentReferenceDto } from "../dtos";
import { BillService } from ".";
import { SmsService } from "@/modules/core/sms/services";
import { SMS } from "@/modules/core/sms";
import { SmsMessage, smsMessage } from "@/core/smsMessage";
import { BuyPowerWorkflowService } from "@/modules/workflow/billPayment/providers/buyPower/services";
import {
    UnprocessedTransactionException,
    VendPowerFailureException,
    VendPowerResponse,
} from "@/modules/workflow/billPayment";
import { BuyPowerVendInProgressError } from "@/modules/workflow/billPayment/providers/buyPower";

@Injectable()
export class PowerBillService {
    constructor(
        private iRechargeWorkflowService: IRechargeWorkflowService,
        private prisma: PrismaService,
        @Inject(forwardRef(() => BillService))
        private billService: BillService,
        private billEvent: BillEvent,
        private smsService: SmsService,
        private buyPowerWorkflowService: BuyPowerWorkflowService
    ) {}

    async getElectricDiscos(): Promise<ApiResponse> {
        let discos: FormattedElectricDiscoData[] = [];

        //Always fetch ikeja by default
        const ikejaProvider = await this.prisma.billProvider.findUnique({
            where: {
                slug: BillProviderSlugForPower.IKEJA_ELECTRIC,
            },
        });

        const queryOptions = {
            where: {
                billProviderSlug: ikejaProvider.slug,
            },
            select: {
                billProviderSlug: true,
                billServiceSlug: true,
                prepaidMeterCode: true,
                postpaidMeterCode: true,
                discoProvider: {
                    select: {
                        name: true,
                        icon: true,
                    },
                },
            },
        };

        if (ikejaProvider) {
            const ikejaDiscos =
                await this.prisma.billProviderElectricDisco.findMany(
                    queryOptions
                );

            discos = this.formatDiscosOutput(ikejaDiscos);
        }

        //priority on default provider
        let randomBillProvider = await this.prisma.billProvider.findFirst({
            where: {
                isActive: true,
                isDefault: true,
                slug: {
                    not: BillProviderSlugForPower.IKEJA_ELECTRIC,
                },
            },
        });

        if (!randomBillProvider) {
            randomBillProvider = await this.prisma.billProvider.findFirst({
                where: {
                    isActive: true,
                    slug: {
                        not: BillProviderSlugForPower.IKEJA_ELECTRIC,
                    },
                },
            });
        }

        if (randomBillProvider) {
            queryOptions.where.billProviderSlug = randomBillProvider.slug;
            const randomDiscos =
                await this.prisma.billProviderElectricDisco.findMany(
                    queryOptions
                );
            const formattedDiscos = this.formatDiscosOutput(randomDiscos);
            discos = [...discos, ...formattedDiscos];
        }

        return buildResponse({
            message: "Electric discos successfully retrieved",
            data: discos,
        });
    }

    formatDiscosOutput(
        discos: FormatDiscoOptions[]
    ): FormattedElectricDiscoData[] {
        return discos.map((disco) => {
            return {
                billProvider: disco.billProviderSlug,
                billService: disco.billServiceSlug,
                discoType: disco.discoProvider.name,
                icon: disco.discoProvider.icon,
                meter: [
                    {
                        code: disco.prepaidMeterCode,
                        type: MeterType.PREPAID,
                    },
                    {
                        code: disco.postpaidMeterCode,
                        type: MeterType.POSTPAID,
                    },
                ],
            };
        });
    }

    async initializePowerPurchase(
        options: PurchasePowerDto,
        user: User
    ): Promise<ApiResponse> {
        const provider = await this.prisma.billProvider.findUnique({
            where: { slug: options.billProvider },
        });
        if (!provider) {
            throw new PowerPurchaseException(
                "Bill provider does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        if (!provider.isActive) {
            throw new PowerPurchaseException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        const providerDisco =
            await this.prisma.billProviderElectricDisco.findUnique({
                where: {
                    billServiceSlug_billProviderSlug: {
                        billProviderSlug: options.billProvider,
                        billServiceSlug: options.billService,
                    },
                },
            });

        if (!providerDisco) {
            throw new PowerPurchaseException(
                "The disco service is not associated with the bill provider",
                HttpStatus.BAD_REQUEST
            );
        }

        const response = (resp: PowerPurchaseInitializationHandlerOutput) => {
            return buildResponse({
                message: "Power payment successfully initialized",
                data: {
                    amount: options.amount + options.serviceCharge,
                    email: user.email,
                    reference: resp.paymentReference,
                },
            });
        };

        switch (options.paymentProvider) {
            case PaymentProvider.PAYSTACK: {
                const resp = await this.handlePowerPurchaseInitialization({
                    billProvider: provider,
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
                if (wallet.mainBalance < options.amount) {
                    throw new InsufficientWalletBalanceException(
                        "Insufficient wallet balance",
                        HttpStatus.BAD_REQUEST
                    );
                }
                const resp = await this.handlePowerPurchaseInitialization({
                    billProvider: provider,
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

    async handlePowerPurchaseInitialization(
        options: BillPurchaseInitializationHandlerOptions<PurchasePowerDto>
    ): Promise<PowerPurchaseInitializationHandlerOutput> {
        const { billProvider, paymentChannel, purchaseOptions, user } = options;

        const paymentReference = generateId({ type: "reference" });
        const billPaymentReference = generateId({
            type: "numeric",
            length: 12,
        });

        //record transaction
        const transactionCreateOptions: Prisma.TransactionUncheckedCreateInput =
            {
                amount: purchaseOptions.amount,
                flow: TransactionFlow.OUT,
                status: TransactionStatus.PENDING,
                totalAmount: purchaseOptions.amount,
                transactionId: generateId({ type: "transaction" }),
                type: TransactionType.ELECTRICITY_BILL,
                userId: user.id,
                accountId: purchaseOptions.phone,
                billPaymentReference: billPaymentReference,
                billProviderId: billProvider.id,
                meterType: purchaseOptions.meterType,
                paymentChannel: paymentChannel,
                paymentReference: paymentReference,
                paymentStatus: PaymentStatus.PENDING,
                packageType: purchaseOptions.discoType,
                shortDescription:
                    TransactionShortDescription.ELECTRICITY_PAYMENT,
                description: purchaseOptions.narration,
                senderIdentifier: purchaseOptions.meterNumber,
                billServiceSlug: purchaseOptions.billService,
                provider: purchaseOptions.billProvider,
                serviceTransactionCode2: purchaseOptions.meterCode,
                serviceCharge: purchaseOptions.serviceCharge,
            };

        switch (billProvider.slug) {
            //iRecharge provider
            case BillProviderSlug.IRECHARGE: {
                if (!purchaseOptions.accessToken) {
                    throw new PowerPurchaseInitializationHandlerException(
                        `Meter access token is required for ${BillProviderSlug.IRECHARGE} provider`,
                        HttpStatus.BAD_REQUEST
                    );
                }
                transactionCreateOptions.serviceTransactionCode =
                    purchaseOptions.accessToken;
            }
            //buypower provider
            case BillProviderSlugForPower.BUYPOWER: {
                break;
            }

            //Ikeja Electric provider
            case BillProviderSlugForPower.IKEJA_ELECTRIC: {
                break;
            }

            default: {
                throw new PowerPurchaseInitializationHandlerException(
                    "Third party power vending provider not integrated",
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

    async processWebhookPowerPurchase(options: ProcessBillPaymentOptions) {
        try {
            const transaction: CompletePowerPurchaseTransactionOptions =
                await this.prisma.transaction.findUnique({
                    where: {
                        paymentReference: options.paymentReference,
                    },
                    select: {
                        id: true,
                        billProviderId: true,
                        serviceTransactionCode: true,
                        userId: true,
                        accountId: true,
                        amount: true,
                        senderIdentifier: true,
                        receiverIdentifier: true,
                        paymentStatus: true,
                        status: true,
                        billPaymentReference: true,
                        paymentChannel: true,
                        serviceTransactionCode2: true,
                        meterType: true,
                        billServiceSlug: true,
                    },
                });

            if (!transaction) {
                throw new TransactionNotFoundException(
                    "Failed to complete power purchase. Bill Initialization transaction record not found",
                    HttpStatus.NOT_FOUND
                );
            }

            if (transaction.paymentStatus == PaymentStatus.SUCCESS) {
                throw new DuplicatePowerPurchaseException(
                    "Duplicate webhook power payment event",
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
                    select: { email: true, userType: true, phone: true },
                });
            if (!user) {
                throw new UserNotFoundException(
                    "Failed to complete power purchase. Customer details does not exist",
                    HttpStatus.NOT_FOUND
                );
            }

            const billProvider = await this.prisma.billProvider.findUnique({
                where: {
                    id: transaction.billProviderId,
                },
            });

            if (!billProvider) {
                throw new BillProviderNotFoundException(
                    "Failed to complete power purchase. Bill provider not found",
                    HttpStatus.NOT_FOUND
                );
            }

            //complete purchase
            await this.completePowerPurchase({
                transaction: transaction,
                user: user,
                billProvider: billProvider,
            });
        } catch (error) {
            switch (true) {
                case error instanceof IRechargeVendPowerException: {
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

            logger.error(`POWER_PURCHASE_COMPLETION_WEBHOOK_ERROR: ${error}`);
        }
    }

    async completePowerPurchase(
        options: CompleteBillPurchaseOptions<CompletePowerPurchaseTransactionOptions>
    ): Promise<CompletePowerPurchaseOutput> {
        let vendPowerResp: VendPowerResponse;
        try {
            switch (options.billProvider.slug) {
                case BillProviderSlugForPower.IRECHARGE: {
                    vendPowerResp =
                        await this.iRechargeWorkflowService.vendPower({
                            accessToken:
                                options.transaction.serviceTransactionCode, //access token from get meter info -- irecharge
                            accountId: options.transaction.accountId,
                            amount: options.transaction.amount,
                            discoCode:
                                options.transaction.serviceTransactionCode2,
                            email: options.user.email,
                            meterNumber: options.transaction.senderIdentifier,
                            referenceId:
                                options.transaction.billPaymentReference,
                        });
                    return await this.successPurchaseHandler(
                        options,
                        vendPowerResp
                    );
                }

                case BillProviderSlugForPower.BUYPOWER: {
                    vendPowerResp =
                        await this.buyPowerWorkflowService.vendPower({
                            accountId: options.transaction.accountId,
                            amount: options.transaction.amount,
                            discoCode:
                                options.transaction.serviceTransactionCode2,
                            email: options.user.email,
                            meterNumber: options.transaction.senderIdentifier,
                            referenceId:
                                options.transaction.billPaymentReference,
                            meterType: options.transaction
                                .meterType as MeterType,
                        });

                    return await this.successPurchaseHandler(
                        options,
                        vendPowerResp
                    );
                }

                default: {
                    throw new VendPowerFailureException(
                        "Failed to complete power purchase. Invalid bill provider",
                        HttpStatus.NOT_IMPLEMENTED
                    );
                }
            }
        } catch (error) {
            return await this.powerVendFailureAndAutoProviderSwitchHandler(
                options,
                error
            );
        }
    }

    async successPurchaseHandler(
        options: CompleteBillPurchaseOptions<CompletePowerPurchaseTransactionOptions>,
        vendPowerResp: VendPowerResponse
    ) {
        await this.prisma.$transaction(
            async (tx) => {
                await tx.transaction.update({
                    where: {
                        id: options.transaction.id,
                    },
                    data: {
                        units: vendPowerResp.units,
                        token: vendPowerResp.meterToken,
                        status: TransactionStatus.SUCCESS,
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

        if (options.transaction.meterType == MeterType.PREPAID) {
            await this.smsService
                .send<SMS.TermiiProvider>({
                    provider: "termii",
                    phone: options.user.phone,
                    message: smsMessage({
                        template: SmsMessage.Template.PREPAID_METER_VEND,
                        data: {
                            token: vendPowerResp.meterToken,
                            units: vendPowerResp.units,
                        },
                    }),
                })
                .catch(() => false);
        }

        return {
            meterToken: vendPowerResp.meterToken,
            units: vendPowerResp.units,
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
                "Failed to complete wallet payment for power purchase. Payment reference not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.userId != user.id) {
            throw new TransactionNotFoundException(
                "Failed to complete wallet payment for power purchase. Invalid user payment reference",
                HttpStatus.NOT_FOUND
            );
        }

        if (transaction.type != TransactionType.ELECTRICITY_BILL) {
            throw new InvalidBillTypePaymentReference(
                "Invalid power bill reference",
                HttpStatus.BAD_REQUEST
            );
        }

        if (transaction.paymentStatus == PaymentStatus.SUCCESS) {
            throw new DuplicatePowerPurchaseException(
                "Duplicate power payment",
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
            throw new PowerPurchaseException(
                "Bill provider does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        if (!billProvider.isActive) {
            //TODO: AUTOMATION UPGRADE, check for an active provider and switch automatically
            throw new PowerPurchaseException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        //charge wallet and update payment status
        await this.billService.walletChargeHandler({
            amount: transaction.totalAmount,
            transactionId: transaction.id,
            walletId: wallet.id,
        });

        //purchase
        try {
            const purchaseInfo = await this.completePowerPurchase({
                billProvider: billProvider,
                transaction: transaction,
                user: {
                    email: user.email,
                    userType: user.userType,
                    phone: user.phone,
                },
                isWalletPayment: true,
            });

            if (purchaseInfo) {
                return buildResponse({
                    message: "Power purchase successful",
                    data: {
                        meter: {
                            units: purchaseInfo.units,
                            token: purchaseInfo.meterToken,
                        },
                        reference: options.reference,
                    },
                });
            } else {
                return buildResponse({
                    message: "Power purchase successful",
                    data: {
                        reference: options.reference,
                    },
                });
            }
        } catch (error) {
            switch (true) {
                case error instanceof IRechargeVendPowerException: {
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

    async verifyPowerPurchase(options: PaymentReferenceDto, user: User) {
        const transaction = await this.prisma.transaction.findUnique({
            where: {
                paymentReference: options.reference,
            },
            select: {
                type: true,
                status: true,
                units: true,
                token: true,
                userId: true,
                paymentReference: true,
                transactionId: true,
                packageType: true,
                accountId: true,
                meterType: true,
                senderIdentifier: true,
                amount: true,
                paymentChannel: true,
                paymentStatus: true,
                serviceCharge: true,
                createdAt: true,
                updatedAt: true,
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

        if (transaction.type != TransactionType.ELECTRICITY_BILL) {
            throw new InvalidBillTypePaymentReference(
                "Invalid reference type",
                HttpStatus.BAD_REQUEST
            );
        }

        const data: VerifyPurchase<VerifyPowerPurchaseData> = {
            status: transaction.status,
            paymentStatus: transaction.paymentStatus,
            paymentReference: transaction.paymentReference,
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            serviceCharge: transaction.serviceCharge,
            paymentChannel: transaction.paymentChannel,
            disco: transaction.packageType,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
            },
            meter: {
                type: transaction.meterType,
                accountId: transaction.accountId,
                meterNumber: transaction.senderIdentifier,
                token: transaction.token,
                units: transaction.units,
            },
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
        };

        return buildResponse({
            message: "Power purchase successfully verified",
            data: data,
        });
    }

    async getMeterInfo(options: GetMeterInfoDto): Promise<ApiResponse> {
        const reference = generateId({
            type: "irecharge_ref",
        });
        switch (options.billProvider) {
            case BillProviderSlugForPower.IRECHARGE: {
                const resp = await this.iRechargeWorkflowService.getMeterInfo({
                    discoCode: options.meterCode,
                    meterNumber: options.meterNumber,
                    reference: reference,
                });
                return buildResponse({
                    message: "Meter successfully retrieved",
                    data: resp,
                });
            }
            case BillProviderSlugForPower.IKEJA_ELECTRIC: {
            }

            case BillProviderSlugForPower.BUYPOWER: {
                const resp = await this.buyPowerWorkflowService.getMeterInfo({
                    discoCode: options.meterCode,
                    meterNumber: options.meterNumber,
                    meterType: options.meterType,
                });
                return buildResponse({
                    message: "Meter successfully retrieved",
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

    async powerVendFailureAndAutoProviderSwitchHandler(
        options: CompleteBillPurchaseOptions<CompletePowerPurchaseTransactionOptions>,
        error: HttpException
    ): Promise<CompletePowerPurchaseOutput> {
        const handleUnprocessedTransaction = async () => {
            //handle buypower
            const handleBuyPowerSwitch = async (
                billProvider: BillProvider,
                billProviderDiscoInfo: BillProviderElectricDisco
            ) => {
                const vendPowerResp =
                    await this.buyPowerWorkflowService.vendPower({
                        accountId: options.transaction.accountId,
                        amount: options.transaction.amount,
                        discoCode: billProviderDiscoInfo.prepaidMeterCode,

                        email: options.user.email,
                        meterNumber: options.transaction.senderIdentifier,
                        referenceId: options.transaction.billPaymentReference,
                    });

                await this.prisma.transaction.update({
                    where: {
                        id: options.transaction.id,
                    },
                    data: {
                        serviceTransactionCode2:
                            billProviderDiscoInfo.prepaidMeterCode,
                        provider: billProvider.slug,
                        billProviderId: billProvider.id,
                        serviceTransactionCode: null,
                    },
                });

                return await this.successPurchaseHandler(
                    options,
                    vendPowerResp
                );
            };

            //handle iRecharge
            const handleIRechargeSwitch = async (
                billProvider: BillProvider,
                billProviderDiscoInfo: BillProviderElectricDisco
            ) => {
                //generate meter token
                const discoCode =
                    options.transaction.meterType == MeterType.PREPAID
                        ? billProviderDiscoInfo.prepaidMeterCode
                        : billProviderDiscoInfo.postpaidMeterCode;

                const meterInfo =
                    await this.iRechargeWorkflowService.getMeterInfo({
                        meterNumber: options.transaction.senderIdentifier,
                        reference: generateId({
                            type: "irecharge_ref",
                        }),
                        discoCode: discoCode,
                    });

                const vendPowerResp =
                    await this.iRechargeWorkflowService.vendPower({
                        accessToken: meterInfo.accessToken, //
                        accountId: options.transaction.accountId,
                        amount: options.transaction.amount,
                        discoCode: discoCode, //
                        email: options.user.email,
                        meterNumber: options.transaction.senderIdentifier,
                        referenceId: options.transaction.billPaymentReference,
                    });

                await this.prisma.transaction.update({
                    where: {
                        id: options.transaction.id,
                    },
                    data: {
                        serviceTransactionCode2: discoCode,
                        serviceTransactionCode: meterInfo.accessToken,
                        provider: billProvider.slug,
                        billProviderId: billProvider.id,
                    },
                });

                return await this.successPurchaseHandler(
                    options,
                    vendPowerResp
                );
            };

            //
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
                throw new VendPowerFailureException(
                    error.message ?? "Failed to vend power",
                    HttpStatus.NOT_IMPLEMENTED
                );
            }

            //switch automation
            for (const billProvider of billProviders) {
                try {
                    const billProviderDiscoInfo =
                        await this.prisma.billProviderElectricDisco.findUnique({
                            where: {
                                billServiceSlug_billProviderSlug: {
                                    billProviderSlug: billProvider.slug,
                                    billServiceSlug:
                                        options.transaction.billServiceSlug,
                                },
                            },
                        });

                    if (!billProviderDiscoInfo) {
                        throw new BillProviderDiscoNotFound(
                            `Failed to automate power purchase switch for ${billProvider.name} provider. No corresponding disco found`,
                            HttpStatus.NOT_FOUND
                        );
                    }

                    switch (billProvider.slug) {
                        case BillProviderSlugForPower.BUYPOWER: {
                            return await handleBuyPowerSwitch(
                                billProvider,
                                billProviderDiscoInfo
                            );
                        }
                        case BillProviderSlugForPower.IRECHARGE: {
                            return await handleIRechargeSwitch(
                                billProvider,
                                billProviderDiscoInfo
                            );
                        }

                        default: {
                            throw new VendPowerFailureException(
                                error.message ?? "Failed to vend power",
                                HttpStatus.NOT_IMPLEMENTED
                            );
                        }
                    }
                } catch (error) {
                    switch (true) {
                        case error instanceof BuyPowerVendInProgressError: {
                            //TODO
                        }

                        default: {
                            logger.error(error);
                            break;
                        }
                    }
                }
            }
        };

        //

        switch (true) {
            case error instanceof UnprocessedTransactionException: {
                return await handleUnprocessedTransaction();
            }

            case error instanceof BuyPowerVendInProgressError: {
                //TODO:handle buypower
                break;
            }

            default: {
                throw new VendPowerFailureException(
                    error.message ?? "Failed to vend power",
                    HttpStatus.NOT_IMPLEMENTED
                );
            }
        }
    }
}
