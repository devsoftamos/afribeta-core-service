import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ClientData = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();

        const ipAddress = request.ip;

        return ipAddress;
    }
);
