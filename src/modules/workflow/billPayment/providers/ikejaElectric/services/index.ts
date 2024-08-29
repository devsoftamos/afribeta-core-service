import IkejaElectric, {
    CSVFileContent,
    IkejaElectricError,
} from "@calculusky/ikeja-electric-sdk";
import { HttpStatus, Injectable } from "@nestjs/common";
import * as i from "../../../interfaces";
import * as e from "../errors";
import logger from "moment-logger";

@Injectable()
export class IkejaElectricWorkflowService
    implements i.PowerBillPaymentWorkflow
{
    readonly paidType: "POS";
    readonly clientErrorCodes: number[];
    constructor(private ie: IkejaElectric) {
        this.paidType = "POS";
        this.clientErrorCodes = [502, 501, 808, 802, 905, 811, 514, 814, 706];
    }

    generateOrderNo(date?: Date) {
        return this.ie.misc.generateOrderNo(date);
    }

    async getMeterInfo(
        options: i.GetMeterInfoOptions
    ): Promise<i.GetMeterResponse> {
        try {
            switch (options.meterType) {
                case i.MeterType.PREPAID: {
                    const resp = await this.ie.power.confirmDetails({
                        type: "MN",
                        requestNO: options.meterNumber,
                    });

                    return {
                        accessToken: null,
                        meter: {
                            minimumAmount: resp.minimumVend,
                            maximumAmount: null,
                            meterAccountType: resp.accountType,
                        },
                        customer: {
                            name: resp.name,
                            address: resp.serviceAddress,
                        },
                    };
                }

                //postpaid
                default: {
                    const resp = await this.ie.power.confirmDetails({
                        type: "CN",
                        requestNO: options.meterNumber,
                    });

                    return {
                        accessToken: null,
                        meter: {
                            minimumAmount: null,
                            maximumAmount: null,
                            meterAccountType: resp.accountType,
                        },
                        customer: {
                            name: resp.name,
                            address: resp.serviceAddress,
                        },
                    };
                }
            }
        } catch (error) {
            switch (true) {
                case error instanceof IkejaElectricError: {
                    if (this.clientErrorCodes.includes(error.status)) {
                        throw new e.IkejaElectricPowerException(
                            error.message,
                            HttpStatus.BAD_REQUEST
                        );
                    }
                    throw new e.IkejaElectricPowerException(
                        error.message ?? "Unable to retrieve meter details",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new e.IkejaElectricPowerException(
                        error.message ?? "Unable to retrieve meter details",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    async vendPower(options: i.VendPowerOptions): Promise<i.VendPowerResponse> {
        try {
            switch (options.meterType) {
                case i.MeterType.PREPAID: {
                    const resp = await this.ie.power.purchaseCredit(
                        {
                            accountType: options.meterAccountType,
                            amountTendered: options.amount,
                            kind: "PREPAY",
                            orderNO: options.referenceId,
                            paidType: this.paidType,
                            requestNO: options.meterNumber,
                        },
                        { acknowledge: true }
                    );

                    return {
                        meterToken: resp.token,
                        receiptNO: resp.receiptNO,
                        units: resp.units.toString(),
                        demandCategory: resp.accountType,
                        walletBalance: resp.walletBalance,
                        //
                        sgc: resp.sgc,
                        outstandingDebt: resp?.creditBreakdown.outstandingDebt,
                        vat: resp.creditBreakdown?.vat,
                        orgName: resp.orgName,
                        orgNumber: resp.orgNO?.toString(),
                        costOfUnit: resp?.creditBreakdown.costOfUnit,
                        fixedCharge: resp?.creditBreakdown?.fixedCharge,
                        rate: resp?.rate,
                        penalty: resp?.creditBreakdown?.penalty,
                        lor: resp?.creditBreakdown?.lor,
                        reconnectionFee: resp?.creditBreakdown?.reconnectionFee,
                        installationFee: resp?.creditBreakdown?.installationFee,
                        administrativeCharge:
                            resp?.creditBreakdown?.administrativeCharge,
                        meterCost: resp?.creditBreakdown?.meterCost,
                        tariffName: resp.tariffName,
                        address: resp.serviceAddress,
                    };
                }

                //postpaid
                default: {
                    const resp = await this.ie.power.purchaseCredit(
                        {
                            accountType: options.meterAccountType,
                            amountTendered: options.amount,
                            kind: "POSTPAY",
                            orderNO: options.referenceId,
                            paidType: this.paidType,
                            requestNO: options.meterNumber,
                        },
                        { acknowledge: true }
                    );

                    return {
                        receiptNO: resp.receiptNO,
                        demandCategory: resp.accountType,
                        walletBalance: resp.walletBalance,
                        //
                        outstandingDebt: resp.outstandingDebt,
                        remainingDebt: resp.remainingDebt,
                        rate: resp.rate,
                        tariffName: resp.tariffName,
                        address: resp.serviceAddress,
                    };
                }
            }
        } catch (error) {
            switch (true) {
                case error instanceof IkejaElectricError: {
                    if (this.clientErrorCodes.includes(error.status)) {
                        throw new e.IkejaElectricPowerException(
                            error.message,
                            HttpStatus.BAD_REQUEST
                        );
                    }

                    throw new e.IkejaElectricVendPowerException(
                        error.message ?? "Unable to vend power",
                        HttpStatus.NOT_IMPLEMENTED
                    );
                }

                default: {
                    throw new e.IkejaElectricPowerException(
                        error.message ?? "Unable to vend power",
                        HttpStatus.NOT_IMPLEMENTED
                    );
                }
            }
        }
    }

    async uploadReconciliationFile(content: CSVFileContent) {
        try {
            return await this.ie.reconciler.uploadReconciliationFile(content, {
                notify: true,
            });
        } catch (error) {
            logger.error(error);
        }
    }
}
