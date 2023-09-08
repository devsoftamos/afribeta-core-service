import { PrismaService } from "@/modules/core/prisma/services";
import { ApiResponse, buildResponse } from "@/utils/api-response-util";
import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { FetchMerchantAgentsDto } from "../dtos";


@Injectable()
export class AdminUserService{

    constructor(
        private prisma: PrismaService,
    ){}

    async fetchAMerchant(options: FetchMerchantAgentsDto, user: User): Promise<ApiResponse>{


        const pageSize = 10;

        let pageNumber;
        if (options.page === undefined) {
            pageNumber = 0;
        } else {
            pageNumber = Number(options.page) - 1;
        };

    const pagination = pageNumber * pageSize;
    console.log(pagination)

      
        const merchants = await this.prisma.user.findMany({
            skip: pagination,
            take: pageSize,
            where:{
                merchantUpgradeStatus: options.merchantStatus
            },
            select:{
                businessName: true,
                email: true,
                phone: true,
                state: {
                    select: {
                        name: true
                    }
                },
                lga: {
                    select: {
                        name: true
                    }
                }

            }
        });
        
        //pagination
        
        return buildResponse({
            message: "Merchants retrieved successfully",
            data: merchants,
        });

    }
    
}