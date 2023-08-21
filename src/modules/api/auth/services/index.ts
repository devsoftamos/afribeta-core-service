import { HttpStatus, Injectable } from "@nestjs/common";
import { UserService } from "@/modules/api/user/services";
import { JwtService } from "@nestjs/jwt";
import {
    SignUpDto,
    SignInDto,
    SendVerificationCodeDto,
    PasswordResetRequestDto,
    UpdatePasswordDto,
} from "../dtos";
import {
    DuplicateUserException,
    UserNotFoundException,
} from "@/modules/api/user";
import * as bcrypt from "bcryptjs";
import {
    MerchantUpgradeStatus,
    Prisma,
    Role,
    User,
    UserType,
} from "@prisma/client";
import { customAlphabet } from "nanoid";
import {
    InvalidCredentialException,
    InvalidEmailVerificationCodeException,
    InvalidPasswordResetToken,
    PasswordResetCodeExpiredException,
    SendVerificationEmailException,
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
import { generateId } from "@/utils";
import { AgentVerifyEmailParams } from "../interfaces";

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
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

    async sendAccountVerificationEmail(
        options: SendVerificationCodeDto
    ): Promise<ApiResponse> {
        try {
            const verificationCode = customAlphabet("1234567890", 4)();
            const email = options.email.toLowerCase().trim();

            const user = await this.userService.findUserByEmail(email);
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
            const emailResp = await this.emailService.send({
                to: { email: email },
                subject: "Verify Your Email",
                provider: "sendinblue",
                templateId: verifyEmailTemplate,
                params: {
                    code: verificationCode,
                    firstName: options.firstName,
                },
            });

            if (emailResp) {
                await this.smsService.termii
                    .send({
                        to: phoneNumber,
                        sms: `Hi, a confirmation code has been sent to your email, ${options.email.trim()}. Kindly verify your account with the code.`,
                        type: "plain",
                        channel: "generic",
                    })
                    .catch(() => false);
            }

            return buildResponse({
                message: `An email verification code has been sent to your email, ${options.email}`,
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

    async signUp(options: SignUpDto, ip: string): Promise<ApiResponse> {
        const user = await this.userService.findUserByEmail(
            options.email.trim()
        );
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
        };

        if (options.userType == UserType.AGENT) {
            if (!options.businessName) {
                throw new InvalidCredentialException(
                    "businessName field is required for the account type",
                    HttpStatus.BAD_REQUEST
                );
            }

            if (!options.state) {
                throw new InvalidCredentialException(
                    "state field is required for the account type",
                    HttpStatus.BAD_REQUEST
                );
            }

            if (!options.localGovernmentArea) {
                throw new InvalidCredentialException(
                    "localGovernmentArea field is required for the account type",
                    HttpStatus.BAD_REQUEST
                );
            }

            createUserOptions.businessName = options.businessName;
            createUserOptions.state = options.state;
            createUserOptions.localGovernmentArea = options.localGovernmentArea;
            createUserOptions.isMerchantUpgradable = true;
            createUserOptions.merchantUpgradeStatus =
                MerchantUpgradeStatus.TO_BE_UPGRADED;
        }

        if (options.userType == UserType.CUSTOMER) {
            if (!options.firstName) {
                throw new InvalidCredentialException(
                    "firstName field is required for the account type",
                    HttpStatus.BAD_REQUEST
                );
            }

            if (!options.lastName) {
                throw new InvalidCredentialException(
                    "lastName field is required for the account type",
                    HttpStatus.BAD_REQUEST
                );
            }
            createUserOptions.firstName = options.firstName;
            createUserOptions.lastName = options.lastName;
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

    async signIn(options: SignInDto): Promise<ApiResponse> {
        const user = await this.userService.findUserByEmail(options.email);
        if (!user) {
            throw new InvalidCredentialException(
                "Incorrect email or password",
                HttpStatus.UNAUTHORIZED
            );
        }

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

        return buildResponse({
            message: "Login successful",
            data: {
                accessToken,
                meta: {
                    kycStatus: user.kycStatus,
                    isWalletCreated: user.isWalletCreated,
                    userType: user.userType,
                },
            },
        });
    }

    async passwordResetRequest(options: PasswordResetRequestDto) {
        const user = await this.userService.findUserByEmail(options.email);
        if (!user) {
            throw new UserNotFoundException(
                "There is no account registered with this email address. Please Sign Up",
                HttpStatus.NOT_FOUND
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
        const user = await this.userService.findUserById(resetData.userId);
        if (!user) {
            throw new UserNotFoundException(
                "Account not found",
                HttpStatus.NOT_FOUND
            );
        }
        const newHarshedPassword = await this.hashPassword(options.newPassword);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: newHarshedPassword },
        });
        await this.prisma.passwordResetRequest.delete({
            where: { code: resetData.code },
        });

        return buildResponse({
            message: `Password successfully updated. Kindly login`,
        });
    }

    async sendAgentAccountVerificationEmail(
        options: SendVerificationCodeDto,
        user: User
    ): Promise<ApiResponse> {
        try {
            const verificationCode = customAlphabet("1234567890", 4)();
            const email = options.email.toLowerCase().trim();

            const agent = await this.userService.findUserByEmail(email);
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
                await this.smsService.termii
                    .send({
                        to: phoneNumber,
                        sms: `Hi, a confirmation code has been triggered by an Afribeta Merchant, ${
                            user.firstName
                        } ${
                            user.lastName
                        } to your email, ${options.email.trim()}. Kindly send back the code to the merchant to complete your Afribeta Agent Account creation.`,
                        type: "plain",
                        channel: "generic",
                    })
                    .catch(() => false);
            }

            return buildResponse({
                message: `An email verification code has been sent to the agent's email, ${options.email}`,
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
}
