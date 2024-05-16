import { AuthGuard, EnabledAccountGuard } from "@/modules/api/auth/guard";
import {
    Body,
    Controller,
    Get,
    Patch,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { UpdateDefaultBillProviderDto } from "../../dtos";
import { BillService } from "../../services";

@UseGuards(AuthGuard, EnabledAccountGuard)
@Controller({
    path: "admin/bill",
})
export class AdminBillController {
    constructor(private readonly billService: BillService) {}

    @Patch("provider")
    async billHistory(
        @Body(ValidationPipe) bodyDto: UpdateDefaultBillProviderDto
    ) {
        return await this.billService.adminUpdateDefaultBillProvider(bodyDto);
    }

    @Get("provider")
    async getProviders() {
        return await this.billService.getProviders();
    }
}
