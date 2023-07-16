import { AuthGuard } from "@/modules/api/auth/guard";
import {
    Controller,
    Get,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { GetDataBundleDto } from "../../dtos/data";
import { DataBillService } from "../../services/data";

@UseGuards(AuthGuard)
@Controller({
    path: "bill/data",
})
export class DataController {
    constructor(private readonly dataBillService: DataBillService) {}

    @Get()
    async getDataBundles(
        @Query(ValidationPipe) getDataBundleDto: GetDataBundleDto
    ) {
        return await this.dataBillService.getDataBundles(getDataBundleDto);
    }
}
