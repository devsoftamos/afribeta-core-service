import { Process, Processor } from "@nestjs/bull";
import { IeQueue, ScheduleQueue } from "../interfaces";
import { PrismaService } from "@/modules/core/prisma/services";
import { IkejaElectricWorkflowService } from "@/modules/workflow/billPayment/providers/ikejaElectric/services";
import * as dateFns from "date-fns";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { BillProviderSlugForPower } from "@/modules/api/bill/interfaces";
import {
    CsvFileBodyContent,
    CsvFirstRowContent,
} from "@calculusky/ikeja-electric-sdk";
import { MeterType } from "@/modules/workflow/billPayment";

@Processor(ScheduleQueue.IE_QUEUE)
export class IkejaElectricQueueProcessor {
    constructor(
        private prisma: PrismaService,
        private ieWorkflowService: IkejaElectricWorkflowService
    ) {}

    @Process(IeQueue.IE_RECONCILIATION)
    async processReconciliationFileUpload() {
        const startOfYesterday = dateFns.startOfYesterday();
        const endOfYesterday = dateFns.endOfYesterday();

        const dailyTransactions = await this.prisma.transaction.findMany({
            orderBy: { updatedAt: "desc" },
            where: {
                type: TransactionType.ELECTRICITY_BILL,
                status: TransactionStatus.SUCCESS,
                billProvider: {
                    slug: BillProviderSlugForPower.IKEJA_ELECTRIC,
                },
                updatedAt: { gte: startOfYesterday, lte: endOfYesterday },
            },
            select: {
                amount: true,
                billPaymentReceiptNO: true,
                meterType: true,
                billPaymentReference: true,
                senderIdentifier: true,
                updatedAt: true,
            },
        });

        const totalAmount = dailyTransactions.reduce(
            (acc, hash) => acc + hash.amount,
            0
        );
        const formattedTotalAmount = parseFloat(totalAmount.toFixed(2));

        const firstRowContent: CsvFirstRowContent = {
            totalAmount: formattedTotalAmount,
            totalRecord: dailyTransactions.length,
            transactionStartDate: dateFns.format(startOfYesterday, "yyyyMMdd"),
            transactionEndDate: dateFns.format(endOfYesterday, "yyyyMMdd"),
        };

        const transactionRecords: CsvFileBodyContent[] = dailyTransactions.map(
            (t) => {
                return {
                    amountTendered: t.amount,
                    kind:
                        t.meterType == MeterType.PREPAID ? "PREPAY" : "POSTPAY",
                    paidType: this.ieWorkflowService.paidType,
                    orderNO: t.billPaymentReference,
                    receiptNO: t.billPaymentReceiptNO,
                    requestNO: t.senderIdentifier,
                    transactionDate: dateFns.format(
                        t.updatedAt,
                        "yyyyMMddHHmmss"
                    ),
                };
            }
        );

        const resp = await this.ieWorkflowService.uploadReconciliationFile({
            firstRow: firstRowContent,
            records: transactionRecords,
        });

        console.log(resp, "****************QUEUE********");
    }
}
