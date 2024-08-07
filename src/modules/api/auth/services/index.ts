import { HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
    SignUpDto,
    SignInDto,
    SendVerificationCodeDto,
    PasswordResetRequestDto,
    UpdatePasswordDto,
    UserSigInDto,
    UserSignInAppType,
    SubAgentAccountCreateVerificationDto,
} from "../dtos";
import {
    ClientDataInterface,
    DuplicateUserException,
    UserNotFoundException,
} from "@/modules/api/user";
import * as bcrypt from "bcryptjs";
import {
    MerchantUpgradeStatus,
    Prisma,
    Role,
    Status,
    User,
    UserType,
} from "@prisma/client";
import { customAlphabet } from "nanoid";
import {
    AuthGenericException,
    InvalidCredentialException,
    InvalidEmailVerificationCodeException,
    InvalidPasswordResetToken,
    PasswordResetCodeExpiredException,
    SendVerificationEmailException,
    UserAccountDisabledException,
    VerificationCodeExpiredException,
} from "../errors";
import { ApiResponse, buildResponse } from "@/utils/api-response-util";
import { SmsService } from "@/modules/core/sms/services";
import { PrismaService } from "@/modules/core/prisma/services";
import { EmailService } from "@/modules/core/email/services";
import {
    agentVerifyEmailTemplate,
    passwordResetTemplate,
    verifyEmailTemplate,
} from "@/config";
import { SendinblueEmailException } from "@calculusky/transactional-email";
import logger from "moment-logger";
import { encrypt, formatName, generateId } from "@/utils";
import {
    AgentVerifyEmailParams,
    LoginMeta,
    LoginPlatform,
    LoginResponseData,
    SignInOptions,
    SignupResponseData,
} from "../interfaces";
import { SMS } from "@/modules/core/sms";
import { SmsMessage, smsMessage } from "@/core/smsMessage";

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private smsService: SmsService,
        private prisma: PrismaService,
        private emailService: EmailService
    ) {}

    async hashPassword(password: string): Promise<string> {
        return await bcrypt.hash(password, 10);
    }

    async comparePassword(password: string, hash: string): Promise<boolean> {
        return await bcrypt.compare(password, hash);
    }

    validateAdminAccount(userType: UserType) {
        const adminUserTypes: UserType[] = [
            UserType.ADMIN,
            UserType.SUPER_ADMIN,
        ];

        if (!adminUserTypes.includes(userType)) {
            throw new InvalidCredentialException(
                "Incorrect email or password",
                HttpStatus.UNAUTHORIZED
            );
        }
    }

    validateUserAccount(userType: UserType) {
        const userTypes: UserType[] = [
            UserType.CUSTOMER,
            UserType.AGENT,
            UserType.MERCHANT,
        ];

        if (!userTypes.includes(userType)) {
            throw new InvalidCredentialException(
                "Incorrect email or password",
                HttpStatus.UNAUTHORIZED
            );
        }
    }

    validateCustomerAccount(userType: UserType) {
        if (userType !== UserType.CUSTOMER) {
            throw new InvalidCredentialException(
                "Incorrect email or password",
                HttpStatus.UNAUTHORIZED
            );
        }
    }

    validateAgencyAccount(userType: UserType) {
        const userTypes: UserType[] = [UserType.AGENT, UserType.MERCHANT];

        if (!userTypes.includes(userType)) {
            throw new InvalidCredentialException(
                "Incorrect email or password",
                HttpStatus.UNAUTHORIZED
            );
        }
    }

    async sendAccountVerificationEmail(
        options: SendVerificationCodeDto
    ): Promise<ApiResponse> {
        const verificationCode = customAlphabet("1234567890", 4)();
        const email = options.email.toLowerCase().trim();

        const user = await this.prisma.user.findUnique({
            where: { email: email },
        });
        if (user) {
            throw new DuplicateUserException(
                "Account already verified. Kindly login",
                HttpStatus.BAD_REQUEST
            );
        }

        await this.prisma.accountVerificationRequest.upsert({
            where: {
                email: email,
            },
            create: {
                code: verificationCode,
                email: email,
            },
            update: {
                code: verificationCode,
            },
        });

        const phoneNumber = `234${options.phone.trim().substring(1)}`;
        const emailResp = await this.emailService
            .send({
                to: { email: email },
                subject: "Verify Your Email",
                provider: "sendinblue",
                templateId: verifyEmailTemplate,
                params: {
                    code: verificationCode,
                    firstName: formatName(options.firstName),
                },
            })
            .catch(() => false);

        if (emailResp) {
            await this.smsService
                .send<SMS.TermiiProvider>({
                    provider: "termii",
                    phone: phoneNumber,
                    type: "plain",
                    channel: "generic",
                    message: smsMessage({
                        template: SmsMessage.Template.VERIFY_EMAIL,
                        data: {
                            email: options.email,
                        },
                    }),
                })
                .catch(() => false);
        }

        return buildResponse({
            message: `An email verification code has been sent to your email, ${options.email}`,
            data: {
                email: options.email,
                phone: options.phone,
                firstName: options.firstName,
            },
        });
    }

    async signUp(
        options: SignUpDto,
        ip: string
    ): Promise<ApiResponse<SignupResponseData>> {
        const user = await this.prisma.user.findUnique({
            where: { email: options.email.trim() },
        });
        if (user) {
            throw new DuplicateUserException(
                "An account already exist with this email. Please login",
                HttpStatus.BAD_REQUEST
            );
        }

        const verificationData =
            await this.prisma.accountVerificationRequest.findUnique({
                where: { code: options.verificationCode },
            });

        if (!verificationData) {
            throw new InvalidEmailVerificationCodeException(
                "Invalid verification code",
                HttpStatus.BAD_REQUEST
            );
        }

        //check verification expiration
        const timeDifference =
            Date.now() - verificationData.updatedAt.getTime();
        const timeDiffInMin = timeDifference / (1000 * 60);
        if (timeDiffInMin > 30) {
            throw new VerificationCodeExpiredException(
                "Your verification code has expired. Kindly request for a new one",
                HttpStatus.BAD_REQUEST
            );
        }

        const hashedPassword = await this.hashPassword(options.password);
        let role: Role;
        if (options.userType == UserType.AGENT) {
            role = await this.prisma.role.findUnique({
                where: {
                    slug: "agent",
                },
            });
        } else {
            role = await this.prisma.role.findUnique({
                where: {
                    slug: "customer",
                },
            });
        }

        const createUserOptions: Prisma.UserUncheckedCreateInput = {
            email: verificationData.email,
            phone: options.phone.trim(),
            userType: options.userType,
            identifier: generateId({ type: "identifier" }),
            password: hashedPassword,
            ipAddress: ip,
            roleId: role?.id,
            firstName: formatName(options.firstName),
            lastName: formatName(options.lastName),
            middleName: options.middleName && formatName(options.middleName),
        };

        if (options.userType == UserType.AGENT) {
            if (!options.businessName) {
                throw new InvalidCredentialException(
                    "businessName field is required for the account type",
                    HttpStatus.BAD_REQUEST
                );
            }

            if (!options.stateId) {
                throw new InvalidCredentialException(
                    "stateId field is required for the account type",
                    HttpStatus.BAD_REQUEST
                );
            }

            if (!options.localGovernmentAreaId) {
                throw new InvalidCredentialException(
                    "localGovernmentAreaId field is required for the account type",
                    HttpStatus.BAD_REQUEST
                );
            }

            createUserOptions.businessName = options.businessName;
            createUserOptions.stateId = options.stateId;
            createUserOptions.localGovernmentAreaId =
                options.localGovernmentAreaId;
            createUserOptions.isMerchantUpgradable = true;
            createUserOptions.merchantUpgradeStatus =
                MerchantUpgradeStatus.TO_BE_UPGRADED;
        }

        const createdUser = await this.prisma.user.create({
            data: createUserOptions,
        });
        const accessToken = await this.jwtService.signAsync({
            sub: createdUser.identifier,
        });

        await this.prisma.accountVerificationRequest.delete({
            where: { email: options.email },
        });

        return buildResponse({
            message: "Account successfully created",
            data: { accessToken },
        });
    }

    async signIn(
        options: SignInOptions,
        loginPlatform: LoginPlatform,
        clientData: ClientDataInterface
    ): Promise<ApiResponse<LoginResponseData>> {
        const user = await this.prisma.user.findUnique({
            where: {
                email: options.email,
            },
            select: {
                id: true,
                identifier: true,
                password: true,
                kycStatus: true,
                isWalletCreated: true,
                userType: true,
                transactionPin: true,
                walletSetupStatus: true,
                status: true,
                role: {
                    select: {
                        name: true,
                        slug: true,
                        permissions: {
                            select: {
                                permission: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new InvalidCredentialException(
                "Incorrect email or password",
                HttpStatus.UNAUTHORIZED
            );
        }

        if (user.status == Status.DISABLED) {
            throw new UserAccountDisabledException(
                "Account is disabled. Kindly contact customer support",
                HttpStatus.BAD_REQUEST
            );
        }

        switch (loginPlatform) {
            case LoginPlatform.ADMIN: {
                this.validateAdminAccount(user.userType);
                break;
            }
            case LoginPlatform.USER: {
                this.validateUserAccount(user.userType);
                break;
            }

            default: {
                throw new AuthGenericException(
                    "Invalid login platform",
                    HttpStatus.INTERNAL_SERVER_ERROR
                );
            }
        }

        //validate user app type for user login
        if (options.appType && loginPlatform === LoginPlatform.USER) {
            switch (options.appType) {
                case UserSignInAppType.CUSTOMER: {
                    this.validateCustomerAccount(user.userType);
                    break;
                }
                case UserSignInAppType.AGENCY: {
                    this.validateAgencyAccount(user.userType);
                    break;
                }

                default: {
                    throw new AuthGenericException(
                        "Invalid user login app type",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }

        const permissions = user.role.permissions.map((p) => p.permission.name);

        const isValidPassword = await this.comparePassword(
            options.password,
            user.password
        );

        if (!isValidPassword) {
            throw new InvalidCredentialException(
                "Incorrect email or password",
                HttpStatus.UNAUTHORIZED
            );
        }

        const accessToken = await this.jwtService.signAsync({
            sub: user.identifier,
        });

        await this.prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                ipAddress: clientData.ipAddress,
            },
        });

        const loginMeta: LoginMeta = {
            kycStatus: user.kycStatus,
            isWalletCreated: user.isWalletCreated,
            userType: user.userType,
            transactionPin: user.transactionPin,
            walletSetupStatus: user.walletSetupStatus,
            role: {
                name: user.role.name,
                slug: user.role.slug,
                permissions: permissions,
            },
        };

        return buildResponse({
            message: "Login successful",
            data: {
                accessToken,
                meta: encrypt(loginMeta),
            },
        });
    }

    async userSignIn(
        options: UserSigInDto,
        clientData: ClientDataInterface
    ): Promise<ApiResponse<LoginResponseData>> {
        return await this.signIn(options, LoginPlatform.USER, clientData);
    }

    async adminSignIn(
        options: SignInDto,
        clientData: ClientDataInterface
    ): Promise<ApiResponse<LoginResponseData>> {
        return await this.signIn(options, LoginPlatform.ADMIN, clientData);
    }

    async passwordResetRequest(options: PasswordResetRequestDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: options.email },
        });
        if (!user) {
            throw new UserNotFoundException(
                "There is no account registered with this email address. Please Sign Up",
                HttpStatus.NOT_FOUND
            );
        }

        if (user.status == Status.DISABLED) {
            throw new UserAccountDisabledException(
                "Account is disabled. Kindly contact customer support",
                HttpStatus.BAD_REQUEST
            );
        }

        const resetCode = customAlphabet("1234567890", 4)();
        await this.prisma.passwordResetRequest.upsert({
            where: {
                userId: user.id,
            },
            create: {
                code: resetCode,
                userId: user.id,
            },
            update: {
                code: resetCode,
            },
        });

        await this.emailService
            .send({
                to: [{ email: options.email }],
                provider: "sendinblue",
                subject: "Reset Your Password",
                templateId: passwordResetTemplate,
                params: {
                    code: resetCode,
                    firstName: user.firstName,
                },
            })
            .catch(() => false);

        return buildResponse({
            message: `Password reset code successfully sent to your email, ${options.email}`,
        });
    }

    async updatePassword(options: UpdatePasswordDto): Promise<ApiResponse> {
        const resetData = await this.prisma.passwordResetRequest.findUnique({
            where: { code: options.resetCode },
        });
        if (!resetData) {
            throw new InvalidPasswordResetToken(
                "Invalid password reset code. Kindly request for a new one",
                HttpStatus.BAD_REQUEST
            );
        }
        //check verification expiration
        const timeDifference = Date.now() - resetData.updatedAt.getTime();
        const timeDiffInMin = timeDifference / (1000 * 60);
        if (timeDiffInMin > 30) {
            throw new PasswordResetCodeExpiredException(
                "Your reset code has expired. Kindly request for new one",
                HttpStatus.BAD_REQUEST
            );
        }
        const user = await this.prisma.user.findUnique({
            where: { id: resetData.userId },
        });
        if (!user) {
            throw new UserNotFoundException(
                "Account not found",
                HttpStatus.NOT_FOUND
            );
        }
        const newHashedPassword = await this.hashPassword(options.newPassword);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: newHashedPassword },
        });
        await this.prisma.passwordResetRequest.delete({
            where: { code: resetData.code },
        });

        return buildResponse({
            message: `Password successfully updated. Kindly login`,
        });
    }

    async sendSubAgentAccountVerificationEmail(
        options: SendVerificationCodeDto,
        user: User
    ): Promise<ApiResponse> {
        try {
            const verificationCode = customAlphabet("1234567890", 4)();
            const email = options.email.toLowerCase().trim();

            const agent = await this.prisma.user.findUnique({
                where: { email: options.email },
            });
            if (agent) {
                throw new DuplicateUserException(
                    "Account already verified. Kindly login",
                    HttpStatus.BAD_REQUEST
                );
            }

            await this.prisma.accountVerificationRequest.upsert({
                where: {
                    email: email,
                },
                create: {
                    code: verificationCode,
                    email: email,
                },
                update: {
                    code: verificationCode,
                },
            });

            const phoneNumber = `234${options.phone.trim().substring(1)}`;
            const emailResp =
                await this.emailService.send<AgentVerifyEmailParams>({
                    to: { email: email },
                    subject: "Agent Email Verification",
                    provider: "sendinblue",
                    templateId: agentVerifyEmailTemplate,
                    params: {
                        code: verificationCode,
                        firstName: options.firstName,
                        merchantName: `${user.firstName} ${user.lastName}`,
                        merchantEmail: user.email,
                    },
                });

            if (emailResp) {
                await this.smsService
                    .send<SMS.TermiiProvider>({
                        provider: "termii",
                        phone: phoneNumber,
                        message: smsMessage({
                            template: SmsMessage.Template.SUBAGENT_VERIFY_EMAIL,
                            data: {
                                email: options.email,
                                merchantFirstName: user.firstName,
                                merchantLastName: user.lastName,
                            },
                        }),
                    })
                    .catch(() => false);
            }

            return buildResponse({
                message: `An email verification code has been sent to the email, ${options.email}`,
            });
        } catch (error) {
            logger.error(error);
            switch (true) {
                case error instanceof DuplicateUserException: {
                    throw error;
                }

                case error instanceof SendinblueEmailException: {
                    throw new SendVerificationEmailException(
                        "Error from email provider. Please try again",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }

                default: {
                    throw new SendVerificationEmailException(
                        "Unable to send email verification",
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }

    async verifySubAgentEmailVerificationCode(
        options: SubAgentAccountCreateVerificationDto
    ) {
        const verificationData =
            await this.prisma.accountVerificationRequest.findUnique({
                where: { code: options.verificationCode },
            });

        if (!verificationData) {
            throw new InvalidEmailVerificationCodeException(
                "Verification code not found",
                HttpStatus.NOT_FOUND
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

        await this.prisma.accountVerificationRequest.update({
            where: {
                id: verificationData.id,
            },
            data: {
                isVerified: true,
            },
        });

        return buildResponse({
            message: "Email successfully verified",
        });
    }
}
