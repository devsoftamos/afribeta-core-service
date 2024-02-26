import { AuthGuard } from "@/modules/api/auth/guard";

import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    UseGuards,
    ValidationPipe,
} from "@nestjs/common";

import { AccessControlService } from "../services";
import { CreateRoleDto, FetchRolesDto, UpdateRoleDto } from "../dtos";
@UseGuards(AuthGuard)
@Controller({
    path: "admin/access",
})
export class AdminAccessControlController {
    constructor(private readonly accessControlService: AccessControlService) {}

    @Get("role")
    async fetchRoles(@Query(ValidationPipe) fetchRolesDto: FetchRolesDto) {
        return await this.accessControlService.fetchRoles(fetchRolesDto);
    }

    @Post("role")
    async createRoles(@Body(ValidationPipe) createRoleDto: CreateRoleDto) {
        return await this.accessControlService.createRole(createRoleDto);
    }

    @Get("permission")
    async GetPermissions() {
        return await this.accessControlService.fetchPermissions();
    }

    @Patch("role/:id")
    async updateRole(
        @Param("id", ParseIntPipe) id: number,
        @Body(ValidationPipe) bodyDto: UpdateRoleDto
    ) {
        return await this.accessControlService.updateRole(id, bodyDto);
    }

    @Delete("role/:id")
    async deleteRole(@Param("id", ParseIntPipe) id: number) {
        return await this.accessControlService.deleteRole(id);
    }
}
