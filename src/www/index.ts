import helmet from "helmet";
import { INestApplication, VersioningType } from "@nestjs/common";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "@/modules";
import { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { AllExceptionsFilter } from "@/core/exception/http";
import { classValidatorPipeInstance } from "@/core/pipe";
import { PrismaService } from "@/modules/core/prisma/services";
import * as morgan from "morgan";
import { json } from "express";

export interface CreateServerOptions {
    port: number;
    production?: boolean;
    whitelistedDomains?: string[];
}

export default async (
    options: CreateServerOptions
): Promise<INestApplication> => {
    const app = await NestFactory.create(AppModule, {
        //logger: false,
    });
    const whitelist = options.whitelistedDomains ?? [];

    const corsOptions: CorsOptions = {
        origin: async (origin, callback) => {
            if (!origin) return callback(null, true);

            if (whitelist.indexOf(origin) !== -1) {
                return callback(null, true);
            }
            callback(new Error(`Not allowed by CORS - ${origin}`));
        },
        allowedHeaders: ["Authorization", "X-Requested-With", "Content-Type"],
        methods: ["GET", "PUT", "POST", "PATCH", "DELETE", "OPTIONS"],
        credentials: true,
    };

    app.use(helmet());
    app.enableCors(corsOptions);
    app.use(morgan(options.production ? "combined" : "dev"));
    app.use(json({ limit: "100mb" }));

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
    return app;
};
