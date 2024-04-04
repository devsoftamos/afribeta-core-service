import {
    AGENT_MD_METER_COMMISSION_CAP_AMOUNT,
    agentPostAccountCreateTemplate,
    DB_TRANSACTION_TIMEOUT,
    storageDirConfig,
} from "@/config";
import { EmailService } from "@/modules/core/email/services";
import { PrismaService } from "@/modules/core/prisma/services";
import { generateId, generateRandomNum, PaginationMeta } from "@/utils";
import { ApiResponse, buildResponse } from "@/utils/api-response-util";
import { forwardRef, HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
    KYC_STATUS,
    Prisma,
    User,
    UserType,
    MerchantUpgradeStatus,
    Status,
} from "@prisma/client";
import {
    InvalidEmailVerificationCodeException,
    SendVerificationEmailException,
    VerificationCodeGenericException,
} from "../../auth";
import { AuthService } from "../../auth/services";
import {
    CreateSubAgentDto,
    CreateKycDto,
    CreateTransactionPinDto,
    FetchMerchantAgentsDto,
    ListMerchantAgentsDto,
    MerchantStatusType,
    UpdateProfileDto,
    UpdateProfilePasswordDto,
    UpdateTransactionPinDto,
    VerifyTransactionPinDto,
    AuthorizeAgentToMerchantUpgradeAgentDto,
    AgentUpgradeBillServiceCommissionOptions,
    AuthorizeAgentUpgradeType,
    FetchAllMerchantsDto,
    CountAgentsCreatedDto,
    CreateUserDto,
    EditAgentDto,
    EnableOrDisableUserDto,
    EnableOrDisableUserEnum,
} from "../dtos";
import {
    AgentCreationException,
    AgentUpgradeGenericException,
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
import { BillServiceSlug } from "@/modules/api/bill/interfaces";
import { endOfMonth, startOfMonth } from "date-fns";
import { UploadFactory } from "@/modules/core/upload/services";
import { OceanSpaceService } from "@/modules/core/upload/services/oceanSpace";
import { RoleNotFoundException } from "../../accessControl/errors";
import { RoleSlug } from "../../accessControl/interfaces";

@Injectable()
export class UserService {
    private uploadService: OceanSpaceService;
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => AuthService))
        private authService: AuthService,
        private emailService: EmailService,
        private uploadFactory: UploadFactory
    ) {
        this.uploadService = this.uploadFactory.build({
            provider: "ocean_space",
        });
    }

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
                walletSetupStatus: true,
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

        if (options.photo) {
            const photo = await this.uploadProfileImage(options.photo);
            profileUpdateOptions.photo = photo;
        }

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

    async createAgent(options: CreateSubAgentDto, user: User) {
        //check for duplicate agent
        const email = options.email.trim();
        const userAgent = await this.prisma.user.findUnique({
            where: {
                email: email,
            },
        });

        if (userAgent) {
            throw new DuplicateUserException(
                "An account with the email already exist",
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

        if (!verificationData.isVerified) {
            throw new VerificationCodeGenericException(
                "Please verify the OTP code and proceed",
                HttpStatus.NOT_FOUND
            );
        }

        //validate commissions
        if (options.billServiceCommissions) {
            await this.validateSubAgentCommissionAssignment({
                merchantId: user.id,
                billServiceCommissions: options.billServiceCommissions,
            });
        }
        const password = generateId({ type: "custom_lower_case", length: 8 });
        const hashedPassword = await this.authService.hashPassword(password);
        const role = await this.prisma.role.findUnique({
            where: {
                slug: RoleSlug.SUB_AGENT,
            },
        });
        if (!role) {
            throw new RoleNotFoundException(
                "Failed to assign role. Role not found",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
        const walletNumber = generateId({ type: "walletNumber" });
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
            localGovernmentAreaId: options.localGovernmentAreaId,
            stateId: options.stateId,
            wallet: {
                create: {
                    walletNumber: walletNumber,
                },
            },
        };

        await this.prisma
            .$transaction(
                async (tx) => {
                    const user = await tx.user.create({
                        data: createAgentOptions,
                    });

                    if (options.billServiceCommissions) {
                        createAgentOptions.commissions = {
                            create: options.billServiceCommissions,
                        };
                        const commissions: Prisma.UserCommissionUncheckedCreateInput[] =
                            options.billServiceCommissions.map((commission) => {
                                return {
                                    billServiceSlug: commission.billServiceSlug,
                                    percentage: commission.percentage,
                                    subAgentMdMeterCapAmount:
                                        commission.subAgentMdMeterCapAmount,
                                    userId: user.id,
                                };
                            });

                        await tx.userCommission.createMany({
                            data: commissions,
                        });
                    }

                    await tx.accountVerificationRequest.delete({
                        where: { email: verificationData.email },
                    });

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

        await this.emailService.send<AgentPostAccountCreateEmailParams>({
            provider: "sendinblue",
            subject: "Account Successfully Created",
            to: { email: verificationData.email },
            templateId: agentPostAccountCreateTemplate,
            params: {
                email: verificationData.email,
                firstName: options.firstName,
                password: password,
            },
        });

        return buildResponse({
            message: "Agent successfully created",
        });
    }

    async validateSubAgentCommissionAssignment(
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
                    billService: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

        for (const billCommission of options.billServiceCommissions) {
            const merchantServiceCommission = merchantBillCommissions.find(
                (bc) => bc.billServiceSlug == billCommission.billServiceSlug
            );
            if (!merchantServiceCommission) {
                throw new InvalidAgentCommissionAssignment(
                    "One of the billServiceSlug field is invalid or the selected bill service commission for the sub agent is not available for the merchant",
                    HttpStatus.BAD_REQUEST
                );
            }

            //NB: Only Ikeja Electric for capped amount for MD
            if (
                billCommission.billServiceSlug == BillServiceSlug.IKEJA_ELECTRIC
            ) {
                if (!billCommission.subAgentMdMeterCapAmount) {
                    throw new InvalidAgentCommissionAssignment(
                        "Invalid commission assignment for Ikeja Electric. Capped amount for the Sub Agent MD Meter is required",
                        HttpStatus.BAD_REQUEST
                    );
                }

                if (
                    billCommission.subAgentMdMeterCapAmount >
                    AGENT_MD_METER_COMMISSION_CAP_AMOUNT
                ) {
                    throw new InvalidAgentCommissionAssignment(
                        `Invalid commission assignment for Ikeja Electric. Capped amount for MD Meter must not be greater than ${AGENT_MD_METER_COMMISSION_CAP_AMOUNT}`,
                        HttpStatus.BAD_REQUEST
                    );
                }
            }

            if (!billCommission.percentage) {
                throw new InvalidAgentCommissionAssignment(
                    `The commission for one of the selected bill services, ${merchantServiceCommission.billService.name} is not set`,
                    HttpStatus.BAD_REQUEST
                );
            }

            if (
                billCommission.percentage > merchantServiceCommission.percentage
            ) {
                throw new InvalidAgentCommissionAssignment(
                    `One of the selected bill service, ${merchantServiceCommission.billService.name} commission for the sub agent is greater than the corresponding merchant's commission`,
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    async getMerchantAgents(
        options: ListMerchantAgentsDto,
        user: User,
        id?: number
    ) {
        const meta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.UserFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                createdById: user.id,
            },
            select: {
                id: true,
                firstName: true,
                email: true,
                lastName: true,
                state: {
                    select: {
                        name: true,
                    },
                },
                wallet: {
                    select: {
                        mainBalance: true,
                    },
                },
            },
        };

        if (id) {
            queryOptions.where.createdById = id;
        }

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

    private async uploadKycImage(file: string): Promise<string> {
        const date = Date.now();
        const body = Buffer.from(file, "base64");

        return await this.uploadService.uploadCompressedImage({
            dir: storageDirConfig.kycInfo,
            name: `kyc-image-${date}-${generateRandomNum(5)}`,
            format: "webp",
            body: body,
            quality: 100,
            width: 320,
        });
    }

    private async uploadProfileImage(file: string): Promise<string> {
        const date = Date.now();
        const body = Buffer.from(file, "base64");

        return await this.uploadService.uploadCompressedImage({
            dir: storageDirConfig.profile,
            name: `profile-image-${date}-${generateRandomNum(5)}`,
            format: "webp",
            body: body,
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

    async fetchMerchants(options: FetchMerchantAgentsDto) {
        const paginationMeta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.UserFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {},
            select: {
                id: true,
                lastName: true,
                firstName: true,
                businessName: true,
                userType: true,
                email: true,
                phone: true,
                merchantUpgradeStatus: true,
                state: {
                    select: {
                        name: true,
                    },
                },
                lga: {
                    select: {
                        name: true,
                    },
                },
            },
        };

        if (options.searchName) {
            queryOptions.where.lastName = { search: options.searchName };
            queryOptions.where.firstName = { search: options.searchName };
        }

        switch (options.merchantStatus) {
            case MerchantStatusType.APPROVED_MERCHANTS: {
                queryOptions.where.userType = UserType.MERCHANT;
                break;
            }
            case MerchantStatusType.AGENT_TO_BE_UPGRADED: {
                queryOptions.where.userType = UserType.AGENT;
                queryOptions.where.merchantUpgradeStatus =
                    MerchantUpgradeStatus.TO_BE_UPGRADED;
                break;
            }
        }

        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.user.count({
                where: queryOptions.where,
            });
            paginationMeta.totalCount = count;
            paginationMeta.perPage = limit;
        }

        const merchants = await this.prisma.user.findMany(queryOptions);
        if (options.pagination) {
            paginationMeta.pageCount = merchants.length;
        }

        return buildResponse({
            message: "Merchants retrieved successfully",
            data: {
                meta: paginationMeta,
                records: merchants,
            },
        });
    }

    async fetchCustomers(options: ListMerchantAgentsDto) {
        const paginationMeta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.UserFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {},
            select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
            },
        };

        if (options.searchName) {
            queryOptions.where.firstName = { search: options.searchName };
            queryOptions.where.lastName = { search: options.searchName };
        }

        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.user.count({
                where: queryOptions.where,
            });
            paginationMeta.totalCount = count;
            paginationMeta.perPage = limit;
        }

        const customers = await this.prisma.user.findMany(queryOptions);
        if (options.pagination) {
            paginationMeta.pageCount = customers.length;
        }

        return buildResponse({
            message: "Customers retrieved successfully",
            data: {
                meta: paginationMeta,
                records: customers,
            },
        });
    }

    async merchantDetails(id: number) {
        const userExists = await this.prisma.user.findUnique({
            where: {
                id: id,
            },
        });

        if (!userExists || userExists.userType !== UserType.MERCHANT) {
            throw new UserNotFoundException(
                "Merchant account does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        const walletBalance = await this.prisma.wallet.findUnique({
            where: {
                userId: userExists.id,
            },
            select: {
                mainBalance: true,
            },
        });

        const agentsCreated = await this.prisma.user.aggregate({
            _count: {
                id: true,
            },
            where: {
                createdById: userExists.id,
            },
        });

        const result = {
            walletBalance: walletBalance,
            agentsCreated: agentsCreated._count.id,
        };

        return buildResponse({
            message: "Merchant Details successfully retrieved",
            data: result,
        });
    }

    async authorizeAgentToMerchantUpgradeRequest(
        agentId: number,
        options: AuthorizeAgentToMerchantUpgradeAgentDto
    ) {
        const agent = await this.prisma.user.findUnique({
            where: {
                id: agentId,
            },
            select: {
                id: true,
                userType: true,
                isMerchantUpgradable: true,
                merchantUpgradeStatus: true,
            },
        });

        if (!agent) {
            throw new UserNotFoundException(
                "Agent could not be found",
                HttpStatus.NOT_FOUND
            );
        }

        if (agent.userType == UserType.MERCHANT) {
            throw new AgentUpgradeGenericException(
                "Agent already upgraded",
                HttpStatus.BAD_REQUEST
            );
        }

        if (!agent.isMerchantUpgradable) {
            throw new AgentUpgradeGenericException(
                "User account type is not eligible for a merchant upgrade",
                HttpStatus.BAD_REQUEST
            );
        }

        switch (options.authorizeType) {
            case AuthorizeAgentUpgradeType.APPROVE: {
                await this.approveAgentUpgradeHandler(
                    agentId,
                    options.billServiceCommissions
                );

                return buildResponse({
                    message: "Agent successfully upgraded",
                });
            }

            case AuthorizeAgentUpgradeType.DECLINE: {
                await this.declineAgentUpgradeHandler(agentId);
                return buildResponse({
                    message: "Agent upgrade successfully declined",
                });
            }

            default: {
                throw new AgentUpgradeGenericException(
                    "Failed to authorize upgrade request. Invalid authorize type",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        }
    }

    async validateAgentUpgradeCommissionAssignment(
        assignedCommissions: AgentUpgradeBillServiceCommissionOptions[]
    ) {
        const baseCommissions = await this.prisma.billService.findMany({
            select: {
                slug: true,
                name: true,
                baseCommissionPercentage: true,
            },
        });

        for (const assignedCommission of assignedCommissions) {
            const baseCommission = baseCommissions.find(
                (bc) => bc.slug == assignedCommission.billServiceSlug
            );
            if (!baseCommission) {
                throw new InvalidAgentCommissionAssignment(
                    "The base commission for one of the assigned commissions does not exist",
                    HttpStatus.BAD_REQUEST
                );
            }

            if (!assignedCommission.percentage) {
                throw new InvalidAgentCommissionAssignment(
                    "The commission for one of the selected bill services is not set",
                    HttpStatus.BAD_REQUEST
                );
            }

            if (
                assignedCommission.billServiceSlug !=
                    BillServiceSlug.IKEJA_ELECTRIC &&
                assignedCommission.percentage >
                    baseCommission.baseCommissionPercentage
            ) {
                throw new InvalidAgentCommissionAssignment(
                    `The assigned commission for the bill service, ${baseCommission.name} is greater than the base commission`,
                    HttpStatus.BAD_REQUEST
                );
            }
        }
    }

    async approveAgentUpgradeHandler(
        agentId: number,
        assignedCommissions: AgentUpgradeBillServiceCommissionOptions[]
    ) {
        if (!assignedCommissions) {
            throw new AgentUpgradeGenericException(
                "updated billService commission is required",
                HttpStatus.BAD_REQUEST
            );
        }

        this.validateAgentUpgradeCommissionAssignment(assignedCommissions);
        const role = await this.prisma.role.findUnique({
            where: {
                slug: RoleSlug.MERCHANT,
            },
        });

        if (!role) {
            throw new RoleNotFoundException(
                "Failed to assign merchant role. Role not found",
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }

        await this.prisma.user.update({
            where: {
                id: agentId,
            },
            data: {
                userType: UserType.MERCHANT,
                merchantUpgradeStatus: MerchantUpgradeStatus.UPGRADED,
                roleId: role.id,
                kycStatus: KYC_STATUS.APPROVED,
                commissions: {
                    create: assignedCommissions,
                },
            },
        });
    }

    async declineAgentUpgradeHandler(agentId: number) {
        await this.prisma.user.update({
            where: {
                id: agentId,
            },
            data: {
                merchantUpgradeStatus: MerchantUpgradeStatus.DECLINED,
                kycStatus: KYC_STATUS.DECLINED,
            },
        });
    }

    async getAllMerchants(options: FetchAllMerchantsDto) {
        const paginationMeta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.UserFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                userType: UserType.MERCHANT,
            },
            select: {
                firstName: true,
                lastName: true,
                businessName: true,
                photo: true,
                state: {
                    select: {
                        name: true,
                    },
                },
            },
        };

        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.user.count({
                where: queryOptions.where,
            });
            paginationMeta.totalCount = count;
            paginationMeta.perPage = limit;
        }

        const merchants = await this.prisma.user.findMany(queryOptions);
        if (options.pagination) {
            paginationMeta.pageCount = merchants.length;
        }

        return buildResponse({
            message: "Merchants retrieved successfully",
            data: {
                meta: paginationMeta,
                records: merchants,
            },
        });
    }

    async countAgentsCreated(options: CountAgentsCreatedDto, user: User) {
        const startDate = startOfMonth(new Date(options.date));
        const endDate = endOfMonth(new Date(options.date));

        const agents = await this.prisma.user.count({
            where: {
                createdById: user.id,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        return buildResponse({
            message: "Agents fetched successfully",
            data: {
                agents: agents,
            },
        });
    }

    async fetchAdmins(options: ListMerchantAgentsDto) {
        const paginationMeta: Partial<PaginationMeta> = {};

        const queryOptions: Prisma.UserFindManyArgs = {
            orderBy: { createdAt: "desc" },
            where: {
                userType: UserType.ADMIN,
            },
            select: {
                id: true,
                lastName: true,
                firstName: true,
                email: true,
                phone: true,
                ipAddress: true,
                role: {
                    select: {
                        name: true,
                    },
                },
            },
        };

        if (options.searchName) {
            queryOptions.where.firstName = { search: options.searchName };
            queryOptions.where.lastName = { search: options.searchName };
        }

        if (options.pagination) {
            const page = +options.page || 1;
            const limit = +options.limit || 10;
            const offset = (page - 1) * limit;
            queryOptions.skip = offset;
            queryOptions.take = limit;
            const count = await this.prisma.user.count({
                where: queryOptions.where,
            });
            paginationMeta.totalCount = count;
            paginationMeta.perPage = limit;
            paginationMeta.page = page;
        }

        const users = await this.prisma.user.findMany(queryOptions);
        if (options.pagination) {
            paginationMeta.pageCount = users.length;
        }

        return buildResponse({
            message: "Users fetched successfully",
            data: {
                meta: paginationMeta,
                records: users,
            },
        });
    }

    async createNewUser(options: CreateUserDto) {
        const user = await this.findUserByEmail(options.email);
        if (user) {
            throw new DuplicateUserException(
                "An account with this email already exists",
                HttpStatus.BAD_REQUEST
            );
        }

        const hashedPassword = await this.authService.hashPassword(
            options.password
        );

        const role = await this.prisma.role.findUnique({
            where: {
                id: options.roleId,
            },
        });

        const createUserOptions: Prisma.UserUncheckedCreateInput = {
            identifier: generateId({ type: "identifier" }),
            email: options.email,
            lastName: options.lastName,
            firstName: options.firstName,
            phone: options.phone,
            password: hashedPassword,
            userType: UserType.ADMIN,
            roleId: role.id,
        };

        await this.prisma.user.create({
            data: createUserOptions,
        });

        return buildResponse({
            message: "User created successfully",
        });
    }

    async countMerchants(options: CountAgentsCreatedDto) {
        const startDate = startOfMonth(new Date(options.date));
        const endDate = endOfMonth(new Date(options.date));

        const merchants = await this.prisma.user.count({
            where: {
                userType: UserType.MERCHANT,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        return buildResponse({
            message: "Number of available merchants retrieved successfully",
            data: merchants,
        });
    }

    async getAgentDetails(id: number) {
        const userExists = await this.prisma.user.findUnique({
            where: {
                id: id,
            },
        });

        if (!userExists || userExists.userType !== UserType.AGENT) {
            throw new UserNotFoundException(
                "Agent account does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        const agent = await this.prisma.user.findUnique({
            where: {
                id: id,
            },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                state: {
                    select: {
                        name: true,
                    },
                },
                kycInformation: {
                    select: {
                        address: true,
                        cacDocumentUrl: true,
                        nextOfKinName: true,
                        identificationMeans: true,
                        identificationMeansDocumentUrl: true,
                        nextOfKinPhone: true,
                        nextOfKinAddress: true,
                    },
                },
            },
        });

        return buildResponse({
            message: "Agent details retrieved successfully",
            data: agent,
        });
    }

    async customerDetails(id: number) {
        const userExists = await this.prisma.user.findUnique({
            where: {
                id: id,
            },
        });

        if (!userExists || userExists.userType !== UserType.CUSTOMER) {
            throw new UserNotFoundException(
                "Customer account does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        const customer = await this.prisma.user.findUnique({
            where: {
                id: id,
            },
            select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
            },
        });

        return buildResponse({
            message: "Customer details retrieved successfully",
            data: customer,
        });
    }

    async editAgentDetails(options: EditAgentDto, id: number) {
        const agentExists = await this.prisma.user.findUnique({
            where: {
                id: id,
            },
        });
        if (!agentExists || agentExists.userType !== UserType.AGENT) {
            throw new UserNotFoundException(
                "Agent account does not exist",
                HttpStatus.NOT_FOUND
            );
        }

        const updateAgentOptions: Prisma.UserUpdateInput = {
            firstName: options.firstName,
            lastName: options.lastName,
            phone: options.phone,
        };

        await this.prisma.user.update({
            where: {
                id: id,
            },
            data: updateAgentOptions,
        });

        return buildResponse({
            message: "Agent details updated successfully",
        });
    }

    async enableOrDisableUser(userId: number, options: EnableOrDisableUserDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId,
            },
            select: { id: true },
        });

        if (!user) {
            throw new UserNotFoundException(
                "user not found",
                HttpStatus.NOT_FOUND
            );
        }

        switch (options.actionType) {
            case EnableOrDisableUserEnum.ENABLE: {
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { status: Status.ENABLED },
                });

                return buildResponse({
                    message: "Account successfully enabled",
                });
            }
            case EnableOrDisableUserEnum.DISABLE: {
                await this.prisma.user.update({
                    where: { id: userId },
                    data: { status: Status.DISABLED },
                });
                return buildResponse({
                    message: "Account successfully disabled",
                });
            }
        }
    }
}
