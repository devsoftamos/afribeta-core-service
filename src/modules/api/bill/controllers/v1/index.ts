import { AuthGuard, IsEnabledGuard } from "@/modules/api/auth/guard";
import { User } from "@/modules/api/user";
import {
    Controller,
    Get,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { User as UserModel } from "@prisma/client";
import { PaginationDto } from "../../dtos";
import { BillService } from "../../services";

@UseGuards(AuthGuard, IsEnabledGuard)
@Controller({
    path: "bill",
})
export class BillController {
    constructor(private readonly billService: BillService) {}

    @Get("history")
    async billHistory(
        @Query(ValidationPipe) paginationDto: PaginationDto,
        @User() user: UserModel
    ) {
        return await this.billService.getBillHistory(paginationDto, user);
    }
}
