import { PrismaService } from "@/modules/core/prisma/services";
import { ApiResponse, buildResponse } from "@/utils";
import { Injectable } from "@nestjs/common";
import { GetLgasByStateDto } from "../dtos";

@Injectable()
export class LocationService {
    constructor(private prisma: PrismaService) {}

    async getStates(): Promise<ApiResponse> {
        const states = await this.prisma.state.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
            },
        });

        return buildResponse({
            message: "States successfully retrieved",
            data: states,
        });
    }

    async getLgasByStateId(options: GetLgasByStateDto) {
        const lgas = await this.prisma.localGovernmentArea.findMany({
            where: {
                stateId: +options.id,
            },
            select: {
                id: true,
                name: true,
                stateId: true,
            },
        });
        return buildResponse({
            message: "LGAs successfully retrieved",
            data: lgas,
        });
    }
}
