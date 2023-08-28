import { Controller, Get, Param, Query, ValidationPipe } from "@nestjs/common";
import { GetLgasByStateDto } from "../../dtos";
import { LocationService } from "../../services";

@Controller({
    path: "location",
})
export class LocationController {
    constructor(private readonly locationService: LocationService) {}

    @Get("state")
    async getStates() {
        return await this.locationService.getStates();
    }

    @Get("state/:id/lga")
    async getLgasByStateId(
        @Param(ValidationPipe) getLgasByStateDto: GetLgasByStateDto
    ) {
        return await this.locationService.getLgasByStateId(getLgasByStateDto);
    }
}
