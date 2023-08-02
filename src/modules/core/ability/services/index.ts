import { Injectable } from "@nestjs/common";
import { User, UserType } from "@prisma/client";
import { AbilityBuilder } from "@casl/ability";
import { createPrismaAbility } from "@casl/prisma";
import { Action, AppAbility } from "../interfaces";
import { PrismaService } from "../../prisma/services";

@Injectable()
export class AbilityFactory {
    constructor(private prisma: PrismaService) {}
    async createForUser(user: User) {
        const role = await this.prisma.role.findUnique({
            where: {
                id: user.id,
            },
            select: {
                id: true,
                permissions: true,
            },
        });
        const { can, cannot, build } = new AbilityBuilder<AppAbility>(
            createPrismaAbility
        );

        console.log(user, "****USER******", role);

        if (user.userType != UserType.MERCHANT) {
            cannot(Action.CreateAgent, "User").because(
                "You do not have sufficient permission to create agent"
            );
        }

        if (user.userType == UserType.MERCHANT) {
            can(Action.CreateAgent, "User");
        }

        return build();
    }
}
