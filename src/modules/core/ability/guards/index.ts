import {
    CanActivate,
    ExecutionContext,
    HttpStatus,
    Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CHECK_ABILITY } from "../decorator";
import { RequiredRule } from "../interfaces";
import { AbilityFactory } from "../services";
import { RequestWithUser } from "@/modules/api/auth";
import { ForbiddenError } from "@casl/ability";
import {
    AuthorizationGenericException,
    InsufficientPermissionException,
} from "../errors";

@Injectable()
export class AbilitiesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private abilityFactory: AbilityFactory
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const rules =
            this.reflector.get<RequiredRule[]>(
                CHECK_ABILITY,
                context.getHandler()
            ) || [];

        const { user } = context.switchToHttp().getRequest() as RequestWithUser;
        const ability = await this.abilityFactory.createForUser(user);

        try {
            for (let rule of rules) {
                ForbiddenError.from(ability).throwUnlessCan(
                    rule.action,
                    rule.subject
                );
            }

            return true;
        } catch (error) {
            switch (true) {
                case error instanceof ForbiddenError: {
                    throw new InsufficientPermissionException(
                        error.message,
                        HttpStatus.FORBIDDEN
                    );
                }

                default: {
                    throw new AuthorizationGenericException(
                        error.message,
                        HttpStatus.INTERNAL_SERVER_ERROR
                    );
                }
            }
        }
    }
}
