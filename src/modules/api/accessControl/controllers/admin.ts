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

import { AccessControlService } from "../services";
import { CreateRoleDto, FetchRolesDto } from "../dtos";
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
}
