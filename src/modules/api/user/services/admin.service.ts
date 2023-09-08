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

        const pageSize = 2;

        let pageNumber;
        if (options.page === undefined) {
            pageNumber = 0;
        } else {
            pageNumber = Number(options.page) - 1;
        };

    const pagination = pageNumber * pageSize;

      

        const merchants = await this.prisma.user.findMany({
           
            where:{
                OR: [
                    {
                        firstName: options.searchName,
                    },
                    {
                        lastName: options.searchName
                    },

                ],
               
                    AND: [
                        {
                           userType: 'AGENT' || 'MERCHANT'
                        },

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