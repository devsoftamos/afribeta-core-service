import { AuthGuard } from "@/modules/api/auth/guard";

import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";
import { RolesService } from "../services";
import { CreateRoleDto, FetchRolesDto } from "../dtos";

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

    @Post()
    async createRoles(@Body(ValidationPipe) createRoleDto: CreateRoleDto) {
        return await this.rolesService.createRoles(createRoleDto);
    }
}
