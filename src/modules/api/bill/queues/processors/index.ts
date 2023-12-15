import { Process, Processor } from "@nestjs/bull";
import {
    BillQueue,
    BuyPowerReQueryQueue,
    BuypowerReQueryJobOptions,
} from "../interfaces";
import { Job } from "bull";
import { BuyPowerWorkflowService } from "@/modules/workflow/billPayment/providers/buyPower/services";
import { BuyPowerVendInProgressException } from "@/modules/workflow/billPayment/providers/buyPower";
import { BillEvent } from "../../events";
import { PrismaService } from "@/modules/core/prisma/services";
import { TransactionNotFoundException } from "@/modules/api/transaction";
import { HttpStatus } from "@nestjs/common";
import { PowerBillService } from "../../services/power";
import { BillProviderSlug, BillProviderSlugForPower } from "../../interfaces";
import { AirtimeBillService } from "../../services/airtime";
import { DataBillService } from "../../services/data";
import { InternetBillService } from "../../services/internet";
import { CableTVBillService } from "../../services/cabletv";

@Processor(BillQueue.BUYPOWER_REQUERY)
export class BuypowerReQueryQueueProcessor {
    constructor(
        private buyPowerWorkflowService: BuyPowerWorkflowService,
        private billEvent: BillEvent,
        private prisma: PrismaService,
        private powerBillService: PowerBillService,
        private airtimeBillService: AirtimeBillService,
        private dataBillService: DataBillService,
        private internetBillService: InternetBillService,
        private cableTVBillService: CableTVBillService
    ) {}

    @Process(BuyPowerReQueryQueue.POWER)
    async processPower(options: Job<BuypowerReQueryJobOptions>) {
        const { orderId, transactionId, isWalletPayment } = options.data;

        try {
            const powerVendInfo = await this.buyPowerWorkflowService.reQuery(
                orderId
            );

            const transaction = await this.prisma.transaction.findUnique({
                where: { id: transactionId },
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
                    "Transaction not found",
                    HttpStatus.NOT_FOUND
                );
            }

            const billProvider = await this.prisma.billProvider.findUnique({
                where: {
                    slug: BillProviderSlugForPower.BUYPOWER,
                },
            });

            const user = await this.prisma.user.findUnique({
                where: {
                    id: transaction.userId,
                },
            });

            await this.prisma.transaction.update({
                where: {
                    id: transaction.id,
                },
                data: {
                    serviceTransactionCode: powerVendInfo.disco,
                    provider: billProvider.slug,
                    billProviderId: billProvider.id,
                    serviceTransactionCode2: null,
                },
            });

            await this.powerBillService.successPurchaseHandler(
                {
                    billProvider: billProvider,
                    transaction: transaction,
                    user: user,
                    isWalletPayment: isWalletPayment,
                },
                {
                    meterToken: powerVendInfo.token,
                    units: powerVendInfo.units,
                    receiptNO: powerVendInfo.receiptNo,
                }
            );
            return true;
        } catch (error) {
            switch (true) {
                case error instanceof BuyPowerVendInProgressException: {
                    throw error;
                }

                //failed purchase
                default: {
                    const transaction =
                        await this.prisma.transaction.findUnique({
                            where: { id: transactionId },
                        });
                    if (!transaction) {
                        return false;
                    }
                    this.billEvent.emit("bill-purchase-failure", {
                        transactionId: transaction.id,
                    });
                    return false;
                }
            }
        }
    }

    @Process(BuyPowerReQueryQueue.AIRTIME)
    async processAirtime(options: Job<BuypowerReQueryJobOptions>) {
        const { orderId, transactionId, isWalletPayment } = options.data;

        try {
            const airtimeRequery = await this.buyPowerWorkflowService.reQuery(
                orderId
            );

            const transaction = await this.prisma.transaction.findUnique({
                where: { id: transactionId },
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
                    "Transaction not found",
                    HttpStatus.NOT_FOUND
                );
            }

            const billProvider = await this.prisma.billProvider.findUnique({
                where: {
                    slug: BillProviderSlug.BUYPOWER,
                },
            });

            const user = await this.prisma.user.findUnique({
                where: {
                    id: transaction.userId,
                },
            });

            await this.prisma.transaction.update({
                where: {
                    id: transaction.id,
                },
                data: {
                    provider: billProvider.slug,
                    billProviderId: billProvider.id,
                },
            });

            await this.airtimeBillService.successPurchaseHandler(
                {
                    billProvider: billProvider,
                    transaction: transaction,
                    user: user,
                    isWalletPayment: isWalletPayment,
                },
                {
                    receiptNO: airtimeRequery.receiptNo,
                    networkProviderReference: airtimeRequery.vendRef,
                }
            );
            return true;
        } catch (error) {
            switch (true) {
                case error instanceof BuyPowerVendInProgressException: {
                    throw error;
                }

                //failed purchase
                default: {
                    const transaction =
                        await this.prisma.transaction.findUnique({
                            where: { id: transactionId },
                        });
                    if (!transaction) {
                        return false;
                    }
                    this.billEvent.emit("bill-purchase-failure", {
                        transactionId: transaction.id,
                    });
                    return false;
                }
            }
        }
    }

    @Process(BuyPowerReQueryQueue.DATA)
    async processData(options: Job<BuypowerReQueryJobOptions>) {
        const { orderId, transactionId, isWalletPayment } = options.data;

        try {
            const vendResp = await this.buyPowerWorkflowService.reQuery(
                orderId
            );

            const transaction = await this.prisma.transaction.findUnique({
                where: { id: transactionId },
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
                    "Transaction not found",
                    HttpStatus.NOT_FOUND
                );
            }

            const billProvider = await this.prisma.billProvider.findUnique({
                where: {
                    slug: BillProviderSlug.BUYPOWER,
                },
            });

            const user = await this.prisma.user.findUnique({
                where: {
                    id: transaction.userId,
                },
            });

            await this.prisma.transaction.update({
                where: {
                    id: transaction.id,
                },
                data: {
                    provider: billProvider.slug,
                    billProviderId: billProvider.id,
                },
            });

            await this.dataBillService.successPurchaseHandler(
                {
                    billProvider: billProvider,
                    transaction: transaction,
                    user: user,
                    isWalletPayment: isWalletPayment,
                },
                {
                    networkProviderReference: vendResp.vendRef,
                    receiptNO: vendResp.receiptNo,
                }
            );
            return true;
        } catch (error) {
            switch (true) {
                case error instanceof BuyPowerVendInProgressException: {
                    throw error;
                }

                //failed purchase
                default: {
                    const transaction =
                        await this.prisma.transaction.findUnique({
                            where: { id: transactionId },
                        });
                    if (!transaction) {
                        return false;
                    }
                    this.billEvent.emit("bill-purchase-failure", {
                        transactionId: transaction.id,
                    });
                    return false;
                }
            }
        }
    }

    @Process(BuyPowerReQueryQueue.INTERNET)
    async processInternet(options: Job<BuypowerReQueryJobOptions>) {
        const { orderId, transactionId, isWalletPayment } = options.data;

        try {
            const vendResp = await this.buyPowerWorkflowService.reQuery(
                orderId
            );

            const transaction = await this.prisma.transaction.findUnique({
                where: { id: transactionId },
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
                    "Transaction not found",
                    HttpStatus.NOT_FOUND
                );
            }

            const billProvider = await this.prisma.billProvider.findUnique({
                where: {
                    slug: BillProviderSlug.BUYPOWER,
                },
            });

            const user = await this.prisma.user.findUnique({
                where: {
                    id: transaction.userId,
                },
            });

            await this.prisma.transaction.update({
                where: {
                    id: transaction.id,
                },
                data: {
                    provider: billProvider.slug,
                    billProviderId: billProvider.id,
                },
            });

            await this.internetBillService.successPurchaseHandler(
                {
                    billProvider: billProvider,
                    transaction: transaction,
                    user: user,
                    isWalletPayment: isWalletPayment,
                },
                {
                    amount: transaction.amount,
                    networkProviderReference: vendResp.vendRef,
                    receiver: transaction.senderIdentifier,
                    receiptNO: vendResp.receiptNo,
                }
            );
            return true;
        } catch (error) {
            switch (true) {
                case error instanceof BuyPowerVendInProgressException: {
                    throw error;
                }

                //failed purchase
                default: {
                    const transaction =
                        await this.prisma.transaction.findUnique({
                            where: { id: transactionId },
                        });
                    if (!transaction) {
                        return false;
                    }
                    this.billEvent.emit("bill-purchase-failure", {
                        transactionId: transaction.id,
                    });
                    return false;
                }
            }
        }
    }

    @Process(BuyPowerReQueryQueue.CABLE_TV)
    async processCableTV(options: Job<BuypowerReQueryJobOptions>) {
        const { orderId, transactionId, isWalletPayment } = options.data;

        try {
            const vendResp = await this.buyPowerWorkflowService.reQuery(
                orderId
            );

            const transaction = await this.prisma.transaction.findUnique({
                where: { id: transactionId },
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
                    "Transaction not found",
                    HttpStatus.NOT_FOUND
                );
            }

            const billProvider = await this.prisma.billProvider.findUnique({
                where: {
                    slug: BillProviderSlug.BUYPOWER,
                },
            });

            const user = await this.prisma.user.findUnique({
                where: {
                    id: transaction.userId,
                },
            });

            await this.prisma.transaction.update({
                where: {
                    id: transaction.id,
                },
                data: {
                    provider: billProvider.slug,
                    billProviderId: billProvider.id,
                },
            });

            await this.cableTVBillService.successPurchaseHandler(
                {
                    billProvider: billProvider,
                    transaction: transaction,
                    user: user,
                    isWalletPayment: isWalletPayment,
                },
                {
                    vendRef: vendResp.vendRef,
                    receiptNO: vendResp.receiptNo,
                }
            );
            return true;
        } catch (error) {
            switch (true) {
                case error instanceof BuyPowerVendInProgressException: {
                    throw error;
                }

                //failed purchase
                default: {
                    const transaction =
                        await this.prisma.transaction.findUnique({
                            where: { id: transactionId },
                        });
                    if (!transaction) {
                        return false;
                    }
                    this.billEvent.emit("bill-purchase-failure", {
                        transactionId: transaction.id,
                    });
                    return false;
                }
            }
        }
    }
}
