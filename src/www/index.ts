import helmet from "helmet";
import { INestApplication, VersioningType } from "@nestjs/common";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "@/modules";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { AllExceptionsFilter } from "@/core/exception/http";
import { classValidatorPipeInstance } from "@/core/pipe";
import { PrismaService } from "@/modules/core/prisma/services";
import * as morgan from "morgan";
import { frontendDevOrigin, manualEnvironment, redisUrl } from "@/config";
import waitForRedis from "../utils/wait-for-redis";
import { NestExpressApplication } from "@nestjs/platform-express";

export interface CreateServerOptions {
    port: number;
    production?: boolean;
    whitelistedDomains?: string[];
}

export default async (
    options: CreateServerOptions
): Promise<INestApplication> => {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
        //logger: false,
    });

    let whitelist = options.whitelistedDomains ?? [];
    if (manualEnvironment == "development") {
        whitelist = whitelist.concat(frontendDevOrigin as any);
    }

    const corsOptions: CorsOptions = {
        origin: whitelist,
        allowedHeaders: ["Authorization", "X-Requested-With", "Content-Type"],
        methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
    };

    app.use(helmet());
    app.enableCors(corsOptions);
    app.use(morgan(options.production ? "combined" : "dev"));
    app.useBodyParser("json", { limit: "100mb" });

    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: "1",
        prefix: "api/v",
    });

    app.useGlobalPipes(classValidatorPipeInstance());
    const httpAdapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
    app.listen(options.port);

    //handle prisma enableShutDownHook interference with nest app enableShutdownHooks
    const prismaService = app.get(PrismaService);
    await prismaService.enableShutdownHooks(app);

    //wait for redis connection
    await waitForRedis(redisUrl);
    return app;
};
