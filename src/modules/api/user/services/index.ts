import { PrismaService } from "@/modules/core/prisma/services";
import { ApiResponse, buildResponse } from "@/utils/api-response-util";
import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Prisma, User } from "@prisma/client";
import { AuthService } from "../../auth/services";
import { UpdateProfilePasswordDto, UpsertTransactionPinDto } from "../dtos";
import {
    DuplicateTransactionPinException,
    IncorrectPasswordException,
    UserNotFoundException,
} from "../errors";

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => AuthService))
        private authService: AuthService
    ) {}

    async createUser(options: Prisma.UserCreateInput) {
        return await this.prisma.user.create({
            data: options,
        });
    }

    async findUserByIdentifier(identifier: string) {
        return await this.prisma.user.findUnique({
            where: { identifier: identifier },
        });
    }

    async findUserByEmail(email: string) {
        return await this.prisma.user.findUnique({ where: { email } });
    }
    async findUserById(id: number) {
        return await this.prisma.user.findUnique({
            where: { id: id },
        });
    }

    async getProfile(identifier: string): Promise<ApiResponse> {
        const user = await this.prisma.user.findUnique({
            where: { identifier: identifier },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                identifier: true,
                phone: true,
            },
        });
        return buildResponse({
            message: "Profile successfully retrieved",
            data: user,
        });
    }

    async updateProfilePassword(
        options: UpdateProfilePasswordDto,
        user: User
    ): Promise<ApiResponse> {
        const userData = await this.prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!userData) {
            throw new UserNotFoundException(
                "User profile could not be found",
                HttpStatus.NOT_FOUND
            );
        }

        const isMatched = await this.authService.comparePassword(
            options.oldPassword,
            user.password
        );

        if (!isMatched) {
            throw new IncorrectPasswordException(
                "The old password you entered does not match with your existing password",
                HttpStatus.BAD_REQUEST
            );
        }
        const newHashedPassword = await this.authService.hashPassword(
            options.newPassword
        );

        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: newHashedPassword },
        });

        return buildResponse({
            message: "Password successfully updated",
        });
    }

    async upsertTransactionPin(options: UpsertTransactionPinDto, user: User) {
        const userData = await this.prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!userData) {
            throw new UserNotFoundException(
                "Failed to retrieve account",
                HttpStatus.NOT_FOUND
            );
        }

        const isMatched = await this.authService.comparePassword(
            options.password,
            user.password
        );

        if (!isMatched) {
            throw new IncorrectPasswordException(
                "The password you entered is incorrect",
                HttpStatus.BAD_REQUEST
            );
        }

        const hashedPin = await this.authService.hashPassword(options.pin);
        await this.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                transactionPin: hashedPin,
            },
        });

        return buildResponse({
            message: "Transaction pin successfully saved",
        });
    }
}
