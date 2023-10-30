import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../auth/guard";
import { PermissionService } from "../services";

@UseGuards(AuthGuard)
@Controller({
    path: "admin/permissions",
})
export class PermissionsController {
    constructor(private readonly permissionService: PermissionService) {}

    @Get()
    async GetPermissions() {
        return await this.permissionService.fetchPermissions();
    }
}
