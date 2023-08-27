import {
    agentPostAccountCreateTemplate,
    DB_TRANSACTION_TIMEOUT,
} from "@/config";
import { EmailService } from "@/modules/core/email/services";
import { PrismaService } from "@/modules/core/prisma/services";
import { generateId, PaginationMeta } from "@/utils";
import { ApiResponse, buildResponse } from "@/utils/api-response-util";
import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { KYC_STATUS, Prisma, User, UserType } from "@prisma/client";
import {
    InvalidEmailVerificationCodeException,
    SendVerificationEmailException,
    VerificationCodeExpiredException,
} from "../../auth";
import { AuthService } from "../../auth/services";
import {
    CreateAgentDto,
    CreateKycDto,
    CreateTransactionPinDto,
    ListMerchantAgentsDto,
    UpdateProfileDto,
    UpdateProfilePasswordDto,
    UpdateTransactionPinDto,
    VerifyTransactionPinDto,
} from "../dtos";
import {
    AgentCreationException,
    DuplicateUserException,
    IncorrectPasswordException,
    InvalidAgentCommissionAssignment,
    TransactionPinException,
    UserKycException,
    UserNotFoundException,
} from "../errors";
import {
    AgentPostAccountCreateEmailParams,
    ValidateAgentCommissionAssignmentOptions,
} from "../interfaces";
import logger from "moment-logger";
import { SendinblueEmailException } from "@calculusky/transactional-email";
import { S3Service } from "@/modules/core/upload/services/s3";
import { customAlphabet } from "nanoid";
import { AbilityFactory } from "@/modules/core/ability/services";
import { Action } from "@/modules/core/ability/interfaces";
import { ForbiddenError, subject } from "@casl/ability";
import { InsufficientPermissionException } from "@/modules/core/ability/errors";

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => AuthService))
        private authService: AuthService,
        private emailService: EmailService,
        private s3Service: S3Service,
        private abilityFactory: AbilityFactory
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
                businessName: true,
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

    async updateTransactionPin(
        options: UpdateTransactionPinDto,
        user: User
    ): Promise<ApiResponse> {
        const userData = await this.prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!userData) {
            throw new UserNotFoundException(
                "User account not found",
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

        const hashedPin = await this.authService.hashPassword(
            options.transactionPin
        );
        await this.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                transactionPin: hashedPin,
            },
        });

        return buildResponse({
            message: "Transaction pin successfully updated",
        });
    }

    async verifyTransactionPin(
        options: VerifyTransactionPinDto,
        user: User
    ): Promise<ApiResponse> {
        if (!user.transactionPin) {
            throw new TransactionPinException(
                "No transaction pin found. Kindly setup your transaction pin",
                HttpStatus.NOT_FOUND
            );
        }

        const isMatched = await this.authService.comparePassword(
            options.transactionPin,
            user.transactionPin
        );
        if (!isMatched) {
            throw new TransactionPinException(
                "Incorrect transaction pin",
                HttpStatus.BAD_REQUEST
            );
        }
        return buildResponse({
            message: "Transaction pin successfully verified",
        });
    }

    async createTransactionPin(options: CreateTransactionPinDto, user: User) {
        const userData = await this.prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!userData) {
            throw new UserNotFoundException(
                "User account not found",
                HttpStatus.NOT_FOUND
            );
        }

        if (user.transactionPin) {
            throw new TransactionPinException(
                "Transaction pin already exists. You can change the pin in your settings",
                HttpStatus.BAD_REQUEST
            );
        }

        const hashedPin = await this.authService.hashPassword(
            options.transactionPin
        );
        await this.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                transactionPin: hashedPin,
            },
        });

        return buildResponse({
            message: "Transaction pin successfully created",
        });
    }

    async updateProfile(options: UpdateProfileDto, user: User) {
        const profileUpdateOptions: Prisma.UserUncheckedUpdateInput = {
            firstName: options.firstName ?? user.firstName,
            lastName: options.lastName ?? user.lastName,
            phone: options.phone ?? user.phone,
        };

        // if (options.photo) {
        //     profileUpdateOptions.photo = await this.photoUploadHandler(
        //         options.photo
        //     );
        // }

        const updatedProfile = await this.prisma.user.update({
            where: {
                id: user.id,
            },
            data: profileUpdateOptions,
            select: {
                firstName: true,
                lastName: true,
                phone: true,
                photo: true,
            },
        });

        return buildResponse({
            message: "profile successfully updated",
            data: updatedProfile,
        });
    }

    async createAgent(options: CreateAgentDto, user: User) {
        // console.log(user);
        //check for duplicate agent
        const email = options.email.trim();
        const userAgent = await this.prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        if (userAgent) {
            throw new DuplicateUserException(
                "An agent with the email already exists",
                HttpStatus.BAD_REQUEST
            );
        }
        const verificationData =
            await this.prisma.accountVerificationRequest.findUnique({
                where: { code: options.verificationCode },
            });

        if (!verificationData) {
            throw new InvalidEmailVerificationCodeException(
                "Verification code not found",
                HttpStatus.BAD_REQUEST
            );
        }

        //check verification expiration
        const timeDifference =
            Date.now() - verificationData.updatedAt.getTime();
        const timeDiffInMin = timeDifference / (1000 * 60);
        if (timeDiffInMin > 30) {
            throw new VerificationCodeExpiredException(
                "The verification code has expired. Kindly request for a new one",
                HttpStatus.BAD_REQUEST
            );
        }

        //validate commissions
        await this.validateAgentCommissionAssignment({
            merchantId: user.id,
            billServiceCommissions: options.billServiceCommissions,
        });

        const password = generateId({ type: "custom_lower_case", length: 8 });
        const hashedPassword = await this.authService.hashPassword(password);
        const role = await this.prisma.role.findUnique({
            where: {
                slug: "sub-agent",
            },
        });
        const walletNumber = customAlphabet("1234567890ABCDEFGH", 10)();
        const createAgentOptions: Prisma.UserUncheckedCreateInput = {
            email: verificationData.email,
            firstName: options.firstName,
            lastName: options.lastName,
            identifier: generateId({ type: "identifier" }),
            password: hashedPassword,
            phone: options.phone,
            roleId: role.id,
            userType: UserType.AGENT,
            createdById: user.id,
            isMerchantUpgradable: false,
            isWalletCreated: true,
            commissions: {
                create: options.billServiceCommissions,
            },
            localGovernmentArea: options.localGovernmentArea,
            state: options.state,
            wallet: {
                create: {
                    walletNumber: walletNumber,
                },
            },
        };
        // return {};

        await this.prisma
            .$transaction(
                async (tx) => {
                    const user = await tx.user.create({
                        data: createAgentOptions,
                    });

                    await tx.accountVerificationRequest.delete({
                        where: { email: verificationData.email },
                    });

                    await this.emailService.send<AgentPostAccountCreateEmailParams>(
                        {
                            provider: "sendinblue",
                            subject: "Account Successfully Created",
                            to: { email: verificationData.email },
                            templateId: agentPostAccountCreateTemplate,
                            params: {
                                email: verificationData.email,
                                firstName: options.firstName,
                                password: password,
                            },
                        }
                    );
                    return user;
                },
                { timeout: DB_TRANSACTION_TIMEOUT }
            )
            .catch((error) => {
                logger.error(error);
                switch (true) {
                    case error instanceof SendinblueEmailException: {
                        throw new SendVerificationEmailException(
                            error.message,
                            HttpStatus.INTERNAL_SERVER_ERROR
                        );
                    }

                    default: {
                        throw new AgentCreationException(
                            error.message,
                            HttpStatus.INTERNAL_SERVER_ERROR
                        );
                    }
                }
            });

        return buildResponse({
            message: "Agent successfully created",
        });
    }

    async validateAgentCommissionAssignment(
        options: ValidateAgentCommissionAssignmentOptions
    ) {
        const merchantBillCommissions =
            await this.prisma.userCommission.findMany({
                where: {
                    userId: options.merchantId,
                },
                select: {
                    billServiceSlug: true,
                    percentage: true,
                },
            });

        for (const billCommission of options.billServiceCommissions) {
            const merchantServiceCommission = merchantBillCommissions.find(
                (bc) => bc.billServiceSlug == billCommission.billServiceSlug
            );
            if (!merchantServiceCommission) {
                throw new InvalidAgentCommissionAssignment(
                    "One of the billServiceSlug field is invalid or the selected bill service commission for the agent is not available for the merchant",
                    HttpStatus.BAD_REQUEST
                );
            }

            if (
                billCommission.percentage > merchantServiceCommission.percentage
            ) {
                throw new InvalidAgentCommissionAssignment(
                    "One of the selected bill service commission for the agent is greater than the corresponding merchant's commission",
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    async getMerchantAgents(options: ListMerchantAgentsDto, user: User) {
        const meta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.UserFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                createdById: user.id,
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                wallet: {
                    select: {
                        mainBalance: true,
                    },
                },
            },
        };

        if (options.searchName) {
            queryOptions.where.firstName = { search: options.searchName };
            queryOptions.where.lastName = { search: options.searchName };
        }

        //pagination
        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.user.count({
                where: queryOptions.where,
            });
            meta.totalCount = count;
            meta.page = page;
            meta.perPage = limit;
        }

        const users = await this.prisma.user.findMany(queryOptions);
        if (options.pagination) {
            meta.pageCount = users.length;
        }

        return buildResponse({
            message: "Agents successfully retrieved",
            data: {
                meta: meta,
                records: users,
            },
        });
    }

    async getSingleAgent(id: number, user: User) {
        try {
            const ability = await this.abilityFactory.createForUser(user);
            ForbiddenError.from(ability).throwUnlessCan(
                Action.ViewAgent,
                subject("User", { createdById: id } as any)
            );
        } catch (error) {
            throw new InsufficientPermissionException(
                error.message,
                HttpStatus.FORBIDDEN
            );
        }

        return await this.prisma.user.findFirst({
            where: {
                id: id,
                createdById: user.id,
            },
        });
    }

    async getServiceCommissions(user: User) {
        const billCommissions = await this.prisma.userCommission.findMany({
            where: {
                userId: user.id,
            },
            select: {
                percentage: true,
                billService: {
                    select: {
                        name: true,
                        slug: true,
                        type: true,
                    },
                },
            },
        });
        return buildResponse({
            message: "Bill service commissions successfully retrieved",
            data: billCommissions,
        });
    }

    private async uploadKycImage(file: string): Promise<string> {
        const date = Date.now();
        const directory = "kycInfo";
        const key = `${directory}/kyc-image-${date}.webp`;
        const body = Buffer.from(file, "base64");

        return await this.s3Service.uploadCompressedImage({
            key,
            body: body,
            format: "webp",
            quality: 100,
            width: 320,
        });
    }

    async createKyc(options: CreateKycDto, user: User): Promise<ApiResponse> {
        if (user.kycStatus) {
            throw new UserKycException(
                "KYC already submitted",
                HttpStatus.BAD_REQUEST
            );
        }

        const [cacImageUrl, idUrl] = await Promise.all([
            this.uploadKycImage(options.cacImageFile),
            this.uploadKycImage(options.identificationMeansImageFile),
        ]);

        const userUpdateOptions: Prisma.UserUpdateInput = {
            kycStatus: KYC_STATUS.PENDING,
            kycInformation: {
                create: {
                    address: options.address,
                    cacNumber: options.cacNumber,
                    identificationMeans: options.identificationMeans,
                    identificationMeansDocumentUrl: idUrl,
                    cacDocumentUrl: cacImageUrl,
                    nextOfKinAddress: options.nextOfKinAddress,
                    nextOfKinName: options.nextOfKinName,
                    nextOfKinPhone: options.nextOfKinPhone,
                },
            },
        };

        await this.prisma.user.update({
            where: {
                id: user.id,
            },
            data: userUpdateOptions,
        });

        return buildResponse({
            message: "KYC successfully submitted for approval",
        });
    }
}
