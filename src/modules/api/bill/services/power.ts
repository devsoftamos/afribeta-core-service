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
    UnavailableBillProviderDisco,
} from "../errors";
import {
    CompletePowerPurchaseOutput,
    CompletePowerPurchaseTransactionOptions,
    CompleteBillPurchaseUserOptions,
    BillPurchaseInitializationHandlerOptions,
    ProcessBillPaymentOptions,
    BillProviderSlug,
    CompleteBillPurchaseOptions,
    FormattedElectricDiscoData,
    MeterType,
    FormatDiscoOptions,
    BillProviderSlugForPower,
    VerifyPurchase,
    VerifyPowerPurchaseData,
    PurchaseInitializationHandlerOutput,
    BillServiceSlug,
} from "../interfaces";
import logger from "moment-logger";
import { UserNotFoundException } from "../../user";
import {
    WalletNotFoundException,
    InsufficientWalletBalanceException,
} from "../../wallet";
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
    VendPowerInProgressException,
    VendPowerResponse,
} from "@/modules/workflow/billPayment";
import { BuyPowerVendInProgressException } from "@/modules/workflow/billPayment/providers/buyPower";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import {
    BillQueue,
    BuyPowerReQueryQueue,
    BuypowerReQueryJobOptions,
} from "../queues";
import { IkejaElectricWorkflowService } from "@/modules/workflow/billPayment/providers/ikejaElectric/services";
import { ikejaElectricContact } from "@/config";

@Injectable()
export class PowerBillService {
    constructor(
        private iRechargeWorkflowService: IRechargeWorkflowService,
        private prisma: PrismaService,
        @Inject(forwardRef(() => BillService))
        private billService: BillService,
        private billEvent: BillEvent,
        private smsService: SmsService,
        private buyPowerWorkflowService: BuyPowerWorkflowService,
        @InjectQueue(BillQueue.BUYPOWER_REQUERY)
        private buypowerReQueryQueue: Queue<BuypowerReQueryJobOptions>,
        private ieWorkflowService: IkejaElectricWorkflowService
    ) {}

    async getElectricDiscos(): Promise<ApiResponse> {
        let discos: FormattedElectricDiscoData[] = [];

        //Always fetch ikeja by default
        const ikejaProvider = await this.prisma.billProvider.findFirst({
            where: {
                slug: BillProviderSlugForPower.IKEJA_ELECTRIC,
                isActive: true,
            },
        });

        const queryOptions = {
            where: {},
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
            queryOptions.where = {
                billProviderSlug: ikejaProvider.slug,
            };
            const ikejaDiscos =
                await this.prisma.billProviderElectricDisco.findFirst(
                    queryOptions
                );

            discos = this.formatDiscosOutput([ikejaDiscos]);
        }

        //priority on set default provider
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
            queryOptions.where = {
                billProviderSlug: randomBillProvider.slug,
            };
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

        const response = (resp: PurchaseInitializationHandlerOutput) => {
            return buildResponse({
                message: "Power payment successfully initialized",
                data: {
                    amount: resp.totalAmount,
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
                if (wallet.mainBalance.toNumber() < options.amount) {
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
    ): Promise<PurchaseInitializationHandlerOutput> {
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
                serviceTransactionCode: purchaseOptions.meterCode,
                merchantId: user.createdById,
                meterAccountName: purchaseOptions.meterAccountName,
                address: purchaseOptions.meterAccountAddress,
            };

        //handle service charge
        const hasServiceCharge = this.billService.isServiceChargeApplicable({
            billType: transactionCreateOptions.type,
            serviceCharge: options.purchaseOptions.serviceCharge,
            userType: user.userType,
        });
        if (hasServiceCharge) {
            transactionCreateOptions.serviceCharge =
                purchaseOptions.serviceCharge;

            transactionCreateOptions.totalAmount =
                purchaseOptions.amount + purchaseOptions.serviceCharge;
        }

        switch (billProvider.slug) {
            //iRecharge provider
            case BillProviderSlug.IRECHARGE: {
                if (!purchaseOptions.accessToken) {
                    throw new PowerPurchaseInitializationHandlerException(
                        `Access token is required for the selected provider`,
                        HttpStatus.BAD_REQUEST
                    );
                }
                transactionCreateOptions.serviceTransactionCode2 =
                    purchaseOptions.accessToken;
                break;
            }

            //Ikeja Electric provider
            case BillProviderSlugForPower.IKEJA_ELECTRIC: {
                if (!purchaseOptions.meterAccountType) {
                    throw new PowerPurchaseInitializationHandlerException(
                        "meterAccountType field is required for the selected provider",
                        HttpStatus.BAD_REQUEST
                    );
                }
                transactionCreateOptions.meterAccountType =
                    purchaseOptions.meterAccountType;
                transactionCreateOptions.billPaymentReference =
                    this.ieWorkflowService.generateOrderNo();
                break;
            }

            default: {
                break;
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
            totalAmount: transactionCreateOptions.totalAmount,
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
                        meterAccountType: true,
                    },
                });

            if (!transaction) {
                throw new TransactionNotFoundException(
                    "Failed to complete power purchase. Bill Initialization transaction record not found",
                    HttpStatus.NOT_FOUND
                );
            }

            if (transaction.paymentStatus !== PaymentStatus.PENDING) {
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
                this.billEvent.emit("bill-purchase-failure", {
                    transactionId: transaction.id,
                });
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
            logger.error(error);
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
                                options.transaction.serviceTransactionCode2, //access token from get meter info -- irecharge
                            accountId: options.transaction.accountId,
                            amount: options.transaction.amount,
                            discoCode:
                                options.transaction.serviceTransactionCode,
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
                                options.transaction.serviceTransactionCode,
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

                case BillProviderSlugForPower.IKEJA_ELECTRIC: {
                    vendPowerResp = await this.ieWorkflowService.vendPower({
                        amount: options.transaction.amount,
                        meterNumber: options.transaction.senderIdentifier,
                        meterType: options.transaction.meterType as MeterType,
                        meterAccountType: options.transaction.meterAccountType,
                        referenceId: options.transaction.billPaymentReference,
                    });

                    return await this.successPurchaseHandler(
                        options,
                        vendPowerResp
                    );
                }

                default: {
                    throw new VendPowerFailureException(
                        "Failed to complete power purchase. Bill provider not integrated",
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
        options: CompleteBillPurchaseOptions<CompletePowerPurchaseTransactionOptions>,
        vendPowerResp: VendPowerResponse
    ): Promise<CompletePowerPurchaseOutput> {
        const trans = await this.prisma.transaction.update({
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
                billPaymentReceiptNO: vendPowerResp.receiptNO,
                //
                sgc: vendPowerResp.sgc,
                outstandingDebt: vendPowerResp.outstandingDebt,
                vat: vendPowerResp.vat,
                remainingDebt: vendPowerResp.remainingDebt,
                orgName: vendPowerResp.orgName,
                orgNumber: vendPowerResp.orgNumber,
                costOfUnit: vendPowerResp.costOfUnit,
                fixedCharge: vendPowerResp.fixedCharge,
                rate: vendPowerResp.rate,
                penalty: vendPowerResp.penalty,
                lor: vendPowerResp.lor,
                reconnectionFee: vendPowerResp.reconnectionFee,
                installationFee: vendPowerResp.installationFee,
                administrativeCharge: vendPowerResp.administrativeCharge,
                currentCharge: vendPowerResp.currentCharge,
                meterCost: vendPowerResp.meterCost,
                tariffName: vendPowerResp.tariffName,
            },
        });

        this.billEvent.emit("pay-bill-commission", {
            transactionId: options.transaction.id,
            userType: options.user.userType,
        });

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

        if (trans.billServiceSlug == BillServiceSlug.IKEJA_ELECTRIC) {
            await this.prisma.billProvider
                .update({
                    where: {
                        id: trans.billProviderId,
                    },
                    data: {
                        walletBalance: vendPowerResp.walletBalance,
                    },
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

        if (transaction.paymentStatus !== PaymentStatus.PENDING) {
            throw new DuplicatePowerPurchaseException(
                "Duplicate power purchase payment",
                HttpStatus.BAD_REQUEST
            );
        }

        if (wallet.mainBalance.toNumber() < transaction.totalAmount) {
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
            throw new PowerPurchaseException(
                "Bill Provider not active",
                HttpStatus.BAD_REQUEST
            );
        }

        try {
            //charge wallet and update payment status
            await this.billService.walletChargeHandler({
                amount: transaction.totalAmount,
                transactionId: transaction.id,
                walletId: wallet.id,
            });

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
        } catch (error) {
            switch (true) {
                case error instanceof VendPowerFailureException: {
                    throw error;
                }
                case error instanceof VendPowerInProgressException: {
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
                //
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
                address: true,
                meterAccountName: true,
                billProvider: {
                    select: {
                        slug: true,
                    },
                },
                billService: {
                    select: {
                        icon: true,
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
            icon: transaction.billService?.icon,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
            },
            meter: {
                type: transaction.meterType,
                accountId: transaction.accountId,
                meterNumber: transaction.senderIdentifier,
                token: transaction.token,
                units: transaction.units,
                address: transaction.address,
                name: transaction.meterAccountName,
            },
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
            //
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
                const resp = await this.ieWorkflowService.getMeterInfo({
                    meterNumber: options.meterNumber,
                    meterType: options.meterType,
                });

                return buildResponse({
                    message: "meter successfully retrieved",
                    data: resp,
                });
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

    async autoSwitchProviderOnVendFailureHandler(
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
                            billProviderDiscoInfo.prepaidMeterCode, //prepaid and postpaid are the same
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
                this.billEvent.emit("bill-purchase-failure", {
                    transactionId: options.transaction.id,
                });
                throw new VendPowerFailureException(
                    error.message ??
                        "Failed to vend power. No available bill provider for auto switch",
                    HttpStatus.NOT_IMPLEMENTED
                );
            }

            // start switch automation
            for (let i = 0; i < billProviders.length; i++) {
                try {
                    const billProviderDiscoInfo =
                        await this.prisma.billProviderElectricDisco.findUnique({
                            where: {
                                billServiceSlug_billProviderSlug: {
                                    billProviderSlug: billProviders[i].slug,
                                    billServiceSlug:
                                        options.transaction.billServiceSlug,
                                },
                            },
                        });

                    /**
                     * Note: throw this error if after checking all the bill providers and non has the particular disco service.
                     * Handle this on the last bill provider in the array of billProviders above
                     */
                    if (i == billProviders.length - 1) {
                        if (!billProviderDiscoInfo) {
                            throw new UnavailableBillProviderDisco(
                                `Failed to vend power. The auto selected provider does not have the bill service`,
                                HttpStatus.NOT_FOUND
                            );
                        }
                    }

                    if (billProviderDiscoInfo) {
                        switch (billProviders[i].slug) {
                            case BillProviderSlugForPower.BUYPOWER: {
                                return await handleBuyPowerSwitch(
                                    billProviders[i],
                                    billProviderDiscoInfo
                                );
                            }
                            case BillProviderSlugForPower.IRECHARGE: {
                                return await handleIRechargeSwitch(
                                    billProviders[i],
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
                    }
                } catch (error) {
                    logger.error(error);
                    switch (true) {
                        case error instanceof UnavailableBillProviderDisco: {
                            this.billEvent.emit("bill-purchase-failure", {
                                transactionId: options.transaction.id,
                            });
                            throw new VendPowerFailureException(
                                "Failed to vend power",
                                HttpStatus.NOT_IMPLEMENTED
                            );
                        }

                        case error instanceof BuyPowerVendInProgressException: {
                            await this.buypowerReQueryQueue.add(
                                BuyPowerReQueryQueue.POWER,
                                {
                                    orderId:
                                        options.transaction
                                            .billPaymentReference,
                                    transactionId: options.transaction.id,
                                    isWalletPayment: options.isWalletPayment,
                                }
                            );
                            throw new VendPowerInProgressException(
                                "Power vending in progress",
                                HttpStatus.ACCEPTED
                            );
                        }
                        case error instanceof UnprocessedTransactionException: {
                            if (i == billProviders.length - 1) {
                                this.billEvent.emit("bill-purchase-failure", {
                                    transactionId: options.transaction.id,
                                });
                                throw new VendPowerFailureException(
                                    "Failed to vend power",
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

            //end switch automation
        };

        //check the exception thrown for the automation
        switch (true) {
            case error instanceof UnprocessedTransactionException: {
                return await handleUnprocessedTransaction();
            }

            case error instanceof BuyPowerVendInProgressException: {
                await this.buypowerReQueryQueue.add(
                    BuyPowerReQueryQueue.POWER,
                    {
                        orderId: options.transaction.billPaymentReference,
                        transactionId: options.transaction.id,
                        isWalletPayment: options.isWalletPayment,
                    }
                );
                throw new VendPowerInProgressException(
                    "Power vending in progress",
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
