import { AuthGuard } from "@/modules/api/auth/guard";

import {
    Controller,
    Get,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { RolesService } from "../services";
import { FetchRolesDto } from "../dtos";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/role",
})
export class AdminRolesController {
    constructor(private readonly rolesService: RolesService) {}

    @Get()
    async fetchRoles(@Query(ValidationPipe) fetchRolesDto: FetchRolesDto) {
        return await this.rolesService.fetchRoles(fetchRolesDto);
    }
}
