import { Controller, Get } from "@nestjs/common";
import { BillService } from "../../services";

@Controller({
    path: "bill",
})
export class BillController {
    constructor(private readonly billService: BillService) {}

    @Get("electricity")
    async getElectricDiscos() {
        return await this.billService.getElectricDiscos();
    }
}
