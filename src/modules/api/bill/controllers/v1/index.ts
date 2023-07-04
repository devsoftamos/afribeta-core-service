import { Controller, Get } from "@nestjs/common";
import { BillService } from "../../services";
import { PowerBillService } from "../../services/power";

@Controller({
    path: "bill",
})
export class BillController {
    constructor(
        private readonly billService: BillService,
        private readonly powerBillService: PowerBillService
    ) {}

    @Get("power")
    async getElectricDiscos() {
        return await this.powerBillService.getElectricDiscos();
    }
}
