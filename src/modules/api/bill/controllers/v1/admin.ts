import { AuthGuard, EnabledAccountGuard } from "@/modules/api/auth/guard";
import {
    Body,
    Controller,
    Get,
    Patch,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { UpdateDefaultBillProviderDto, VendStatusDto } from "../../dtos";
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

    //reserved for backend only for verifying
    @Get("vend-status")
    async getVendStatus(@Query() dto: VendStatusDto) {
        return await this.billService.getVendStatus(dto);
    }
}
