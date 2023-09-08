import {
    DB_TRANSACTION_TIMEOUT,
} from "@/config";
import { PrismaService } from "@/modules/core/prisma/services";
import {  PaginationMeta } from "@/utils";
import { ApiResponse, buildResponse } from "@/utils/api-response-util";
import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import logger from "moment-logger";
import { AbilityFactory } from "@/modules/core/ability/services";
import { Action } from "@/modules/core/ability/interfaces";
import { ForbiddenError, subject } from "@casl/ability";
import { ListMerchantAgentsDto } from "../dtos";
import { Prisma, User } from "@prisma/client";


@Injectable()
export class AdminService{

    constructor(
        private prisma: PrismaService,
        private abilityFactory: AbilityFactory
    ){}

    async fetchAMerchant(options: ListMerchantAgentsDto, user: User): Promise<ApiResponse>{

        const meta: Partial<PaginationMeta> = {};

        let limit;
        let offset;

        if (options.pagination) {
            const page = +options.page || 1;
             limit = +options.limit || 10;
             offset = (page - 1) * limit;
            const count = await this.prisma.user.count({
                where: queryOptions.where,
            });
            meta.totalCount = count;
            meta.page = page;
            meta.perPage = limit;
        }

      

        const merchants = await this.prisma.user.findMany({
            skip: offset,
            take: limit,
            where:{
                OR: [
                    {
                        firstName: options.searchName,
                    },
                    {
                        lastName: options.searchName
                    },

                ],
               
                    OR: [
                        {
                           userType: 'AGENT'
                        },

                        {
                            userType: 'MERCHANT'
                        }
                    ]
                
            },
            select:{
                businessName: true,
                email: true,
                firstName: true,
                lastName: true,
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