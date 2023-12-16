import IkejaElectric, {
    IkejaElectricError,
} from "@calculusky/ikeja-electric-sdk";
import { HttpStatus, Injectable } from "@nestjs/common";
import * as i from "../../../interfaces";
import * as e from "../errors";

@Injectable()
export class IkejaElectricWorkflowService
    implements i.PowerBillPaymentWorkflow
{
    private readonly paidType: "POS";
    constructor(private ie: IkejaElectric) {}
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
                    throw new e.IkejaElectricPowerException(
                        error.message ?? "Unable to retrieve meter details",
                        HttpStatus.BAD_REQUEST
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
                    };
                }
            }
        } catch (error) {
            switch (true) {
                case error instanceof IkejaElectricError: {
                    throw new e.IkejaElectricVendPowerException(
                        error.message ?? "Unable to vend power",
                        HttpStatus.BAD_REQUEST
                    );
                }

                default: {
                    throw new e.IkejaElectricPowerException(
                        error.message ?? "Unable to vend power",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    generateOrderNo(date?: Date) {
        return this.ie.misc.generateOrderNo(date);
    }
}
